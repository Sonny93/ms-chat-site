import { Device } from "mediasoup-client";
import { Producer } from "mediasoup-client/lib/Producer";
import { ConnectionState, Transport } from "mediasoup-client/lib/Transport";
import { User } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { consumeMedia } from "../utils/consumer";
import { connectTransport, createTransport } from "../utils/transport";

export default function VideoReceiver({
    device,
    socket,
    producerId,
    userId,
}: {
    device: Device;
    socket: Socket;
    producerId: Producer["id"];
    userId: User["id"];
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [transport, setTransport] = useState<Transport>(null);
    const [stream, setStream] = useState<MediaStream>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>();

    const handleConnectionState = (state: ConnectionState) =>
        setConnectionState(state);

    useEffect(() => {
        if (transport || stream) {
            return () => {
                transport?.close();
                stream?.getTracks().forEach((track) => track.stop());
            };
        }

        initRecvTransport({
            device,
            socket,
            producerId,
            handleConnectionState,
        })
            .then(({ transport, stream }) => {
                setTransport(transport);
                setStream(stream);

                videoRef.current.srcObject = stream;
                videoRef.current.play();
            })
            .catch(console.error);
    }, [device, producerId, socket, stream, transport]);

    return (
        <div>
            <video ref={videoRef} style={{ width: "50%" }} autoPlay controls />
            <p>{userId}</p>
            <p>{connectionState}</p>
        </div>
    );
}

function initRecvTransport({
    device,
    socket,
    producerId,
    handleConnectionState,
}) {
    return new Promise<{ transport: Transport; stream: MediaStream }>(
        async (resolve, reject) => {
            const transport = await createTransport({
                device,
                socket,
                direction: "recv",
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
                    direction: "recv",
                })
                    .then(() => {
                        console.log("[Transport] Connecté au serveur");
                        callback();
                    })
                    .catch((error) => {
                        console.error(error);
                        errback(error);
                        reject(error);
                    });
            };

            transport.on("connectionstatechange", handleConnectionState);
            transport.once("connect", handleConnect);

            console.log(
                "[Transport] Consume media - Échange des données rtp capabilities"
            );
            const { consumerId, rtpParameters } = await consumeMedia({
                socket,
                clientRtpCapabilities: device?.rtpCapabilities,
                producerId,
            });
            const consumer = await transport.consume({
                id: consumerId,
                producerId,
                rtpParameters,
                kind: "video",
            });
            console.log("[Transport] Consume success", consumer);

            const stream = new MediaStream([consumer.track]);
            resolve({ transport, stream });
        }
    );
}
