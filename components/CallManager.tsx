import { useEffect, useMemo, useState } from "react";
import { Socket } from "socket.io-client";

import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";

import { SERVER_EVENTS } from "../types/events";

import { Room, RoomProducer } from "../types/room";
import VideoReceiver from "./VideoReceiver";
import VideoSender from "./VideoSender";

export default function CallManager({
    socket,
    room,
}: {
    socket: Socket;
    room: Room;
}) {
    const [device, setDevice] = useState<Device>(new Device());
    const [callStarted, setCallStarted] = useState<boolean>(false);
    const [usersCall, setUsersCall] = useState<Room["producers"]>(
        room.producers || []
    );

    const canCall = useMemo<boolean>(
        () => (device.loaded ? device.canProduce("video") : false),
        [device]
    );

    const addUserCall = (user: RoomProducer) =>
        setUsersCall((users) => [...users, user]);

    const handleStartCall = () => setCallStarted(true);
    const handleStopCall = () => setCallStarted(false);

    useEffect(() => {
        socket.emit(
            SERVER_EVENTS.ROUTER_RTP_CAPABILITIES,
            async (routerRtpCapabilities: RtpCapabilities) =>
                setDevice(await createDevice({ routerRtpCapabilities }))
        );
        socket.on("call-produce", addUserCall);
    }, [socket]);

    if (!canCall) {
        return <p>cant make call</p>;
    }

    return (
        <>
            {!callStarted ? (
                <button onClick={handleStartCall}>call</button>
            ) : (
                <button onClick={handleStopCall}>stop call</button>
            )}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {callStarted && <VideoSender socket={socket} device={device} />}
                {usersCall.length}
                {usersCall.map(({ userId, producerId }) => {
                    const user = room.users.find((u) => u.id === userId);
                    console.log("userId", userId, room.users, user);
                    return (
                        <VideoReceiver
                            key={userId}
                            user={user}
                            device={device}
                            socket={socket}
                            producerId={producerId}
                        />
                    );
                })}
            </div>
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
