import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

import { Device } from "mediasoup-client";
import { Producer } from "mediasoup-client/lib/Producer";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { ConnectionState, Transport } from "mediasoup-client/lib/Transport";

import { SERVER_EVENTS } from "../types/events";

import { User } from "../types/user";
import { consumeMedia } from "../utils/consumer";
import { produceMedia } from "../utils/producer";
import { connectTransport, createTransport } from "../utils/transport";

export default function CallManager({ socket }: { socket: Socket }) {
    const [canCall, setCanCall] = useState<boolean>(false);

    const [device, setDevice] = useState<Device>(new Device());
    const [callStarted, setCallStarted] = useState<boolean>(false);

    const [usersCall, setUsersCall] = useState<
        { userId: string; producerId: string }[]
    >([]);

    useEffect(() => {
        socket.emit(
            SERVER_EVENTS.ROUTER_RTP_CAPABILITIES,
            async (routerRtpCapabilities: RtpCapabilities) => {
                const device = await createDevice({ routerRtpCapabilities });
                setDevice(device);

                if (!device.canProduce("video")) {
                    setCanCall(false);
                    return console.error(
                        "Le navigateur n'est pas en mesure de produire un flux audio"
                    );
                }

                setCanCall(true);
                socket.on(
                    "call-produce",
                    ({
                        userId,
                        producerId,
                    }: {
                        userId: string;
                        producerId: string;
                    }) => {
                        setUsersCall((users) => [
                            ...users,
                            { userId, producerId },
                        ]);
                    }
                );
            }
        );
    }, [socket]);

    if (!canCall) {
        return <>cant make call</>;
    }

    return (
        <>
            <button onClick={() => setCallStarted(true)}>call</button>
            {callStarted && <VideoSender socket={socket} device={device} />}
            {usersCall.map(({ userId, producerId }) => (
                <VideoReceiver
                    key={userId}
                    userId={userId}
                    device={device}
                    socket={socket}
                    producerId={producerId}
                />
            ))}
        </>
    );
}

function VideoSender({ device, socket }: { device: Device; socket: Socket }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [transport, setTransport] = useState<Transport>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>();

    useEffect(() => {
        if (!transport) {
            createTransport({
                device,
                socket,
                direction: "send",
            })
                .then((transport) => {
                    setTransport(transport);

                    transport.on("connectionstatechange", (connectionState) =>
                        setConnectionState(connectionState)
                    );

                    transport.once(
                        "connect",
                        async ({ dtlsParameters }, callback, errback) => {
                            console.log(
                                "[Transport]",
                                "Connexion au serveur en cours"
                            );
                            connectTransport({
                                dtlsParameters,
                                socket,
                                direction: "send",
                            })
                                .then(() => {
                                    console.log(
                                        "[Transport]",
                                        "Connecté au serveur"
                                    );
                                    callback();
                                })
                                .catch(errback);
                        }
                    );

                    transport.on(
                        "produce",
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
                                    console.log(
                                        "[Transport]",
                                        "Produce success",
                                        produceId
                                    );
                                    callback({ id: produceId });
                                })
                                .catch(errback);
                        }
                    );

                    navigator.mediaDevices
                        .getDisplayMedia({
                            video: {
                                width: 1920,
                                height: 1080,
                            },
                            audio: false,
                        })
                        .then((stream) => {
                            const videoTrack = stream.getVideoTracks()[0];
                            videoRef.current.srcObject = stream;
                            videoRef.current.play();

                            transport.produce({ track: videoTrack });
                        })
                        .catch(console.error);
                })
                .catch(console.error);
        }

        return () => transport?.close();
    }, [device, socket, transport]);

    return (
        <>
            <video ref={videoRef} style={{ width: "50%" }} autoPlay controls />
            <p>{connectionState}</p>
        </>
    );
}

function VideoReceiver({
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
    const [connectionState, setConnectionState] = useState<ConnectionState>();

    useEffect(() => {
        if (!transport) {
            createTransport({
                device,
                socket,
                direction: "recv",
            })
                .then(async (transport) => {
                    setTransport(transport);

                    transport.on("connectionstatechange", (connectionState) =>
                        setConnectionState(connectionState)
                    );

                    transport.once(
                        "connect",
                        async ({ dtlsParameters }, callback, errback) => {
                            console.log(
                                "[Transport]",
                                "Connexion au serveur en cours"
                            );
                            connectTransport({
                                dtlsParameters,
                                socket,
                                direction: "recv",
                            })
                                .then(() => {
                                    console.log(
                                        "[Transport]",
                                        "Connecté au serveur"
                                    );
                                    callback();
                                })
                                .catch(errback);
                        }
                    );

                    console.log(
                        "[Transport]",
                        "Consume media - Échange des données rtp capabilities"
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
                    console.log("[Transport]", "Consume success", consumer);

                    const stream = new MediaStream([consumer.track]);
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                })
                .catch(console.error);
        }

        return () => transport?.close();
    }, [device, producerId, socket, transport]);

    return (
        <>
            <video ref={videoRef} style={{ width: "50%" }} autoPlay controls />
            <p>{userId}</p>
            <p>{connectionState}</p>
        </>
    );
}

async function createDevice({
    routerRtpCapabilities,
}: {
    routerRtpCapabilities: RtpCapabilities;
}) {
    const device = new Device();
    await device.load({ routerRtpCapabilities });
    return device;
}
