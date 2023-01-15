import { Device } from "mediasoup-client";
import { ConnectionState, Transport } from "mediasoup-client/lib/Transport";
import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { produceMedia } from "../utils/producer";
import { connectTransport, createTransport } from "../utils/transport";

export default function VideoSender({
    device,
    socket,
}: {
    device: Device;
    socket: Socket;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [transport, setTransport] = useState<Transport>(null);
    const [stream, setStream] = useState<MediaStream>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>();

    const handleConnectionState = (connectionState: ConnectionState) =>
        setConnectionState(connectionState);

    const handleProduceMedia = useCallback(
        ({ kind, rtpParameters }, callback, errback) => {
            console.log(
                "[Transport]",
                "Procuce media - Échange des données rtp capabilities"
            );

            const produceMediaOptions = {
                socket,
                rtpParameters,
                clientRtpCapabilities: device.rtpCapabilities,
                kind,
            };
            produceMedia(produceMediaOptions)
                .then((produceId) => {
                    console.log("[Transport]", "Produce success", produceId);
                    callback({ id: produceId });
                })
                .catch(errback);
        },
        [device.rtpCapabilities, socket]
    );

    useEffect(() => {
        if (transport || stream) {
            return () => {
                transport?.close();
                stream?.getTracks().forEach((track) => track.stop());
            };
        }

        console.log("Début init");
        initSendVideoTransport({
            device,
            socket,
            handleConnectionState,
            handleProduceMedia,
        })
            .then(async ({ transport, stream }) => {
                setTransport(transport);
                setStream(stream);

                videoRef.current.srcObject = stream;
                videoRef.current.play();
            })
            .catch(console.error);
    }, [device, handleProduceMedia, socket, stream, transport]);

    return (
        <div>
            <video ref={videoRef} style={{ width: "50%" }} autoPlay controls />
            <p>Connection state: {connectionState}</p>
        </div>
    );
}

async function initSendVideoTransport({
    device,
    socket,
    handleConnectionState,
    handleProduceMedia,
}) {
    return new Promise<{ transport: Transport; stream: MediaStream }>(
        async (resolve, reject) => {
            const transport = await createTransport({
                device,
                socket,
                direction: "send",
            });

            const handleConnect = async (
                { dtlsParameters },
                callback,
                errback
            ) => {
                console.log("[Transport]", "Connexion au serveur en cours");
                connectTransport({
                    dtlsParameters,
                    socket,
                    direction: "send",
                })
                    .then(() => {
                        console.log("[Transport]", "Connecté au serveur");
                        callback();
                        resolve({ transport, stream });
                    })
                    .catch((error) => {
                        errback(error);
                        console.error(error);
                        reject(error);
                    });
            };

            transport.once("connect", handleConnect);
            transport.on("connectionstatechange", handleConnectionState);
            transport.on("produce", handleProduceMedia);

            const stream = await getUserStream();
            const videoTrack = stream.getVideoTracks()[0];

            transport.produce({ track: videoTrack });
        }
    );
}

function getUserStream(
    options: DisplayMediaStreamOptions = {
        video: true,
        audio: false,
    }
) {
    return navigator.mediaDevices.getDisplayMedia(options);
}
