import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Socket } from "socket.io-client";

import CallManager from "../../components/CallManager";
import ControlsInput from "../../components/ControlsInput";
import MessageList from "../../components/MessageList";
import UserList from "../../components/UserList";

import {
    addMessage,
    addUser,
    clearMessages,
    clearUsers,
    removeMessage,
    removeUser,
} from "../../lib/Redux";

import { SERVER_EVENTS } from "../../types/events";
import { Message } from "../../types/message";
import { Room } from "../../types/room";
import { User } from "../../types/user";

import styles from "../../styles/chat.module.scss";

function Rooms({
    roomId,
    socket,
}: {
    roomId: string | undefined;
    socket: Socket;
}) {
    const router = useRouter();
    const [room, setRoom] = useState<Room>(null);

    const { messages } = useSelector(
        ({ users, messages }: { users: User[]; messages: Message[] }) => ({
            users,
            messages,
        })
    );
    const dispatch = useDispatch();

    const messageListRef = useRef<HTMLUListElement>(null);

    const handleUserJoin = useCallback(
        (user: User) => dispatch(addUser(user)),
        [dispatch]
    );
    const handleUserLeave = useCallback(
        (user: User) => dispatch(removeUser(user)),
        [dispatch]
    );
    const handleMessageNew = useCallback(
        (message: Message) => dispatch(addMessage(message)),
        [dispatch]
    );
    const handleMessageRemove = useCallback(
        (message: Message) => dispatch(removeMessage(message)),
        [dispatch]
    );

    const handleJoinRoom = useCallback(
        ({ error, room }: { error?: string; room?: Room }) => {
            if (error) {
                console.error(error);
                return router.push("/");
            }
            setRoom(room);

            dispatch(clearUsers());
            dispatch(clearMessages());

            room.users.map((user) => dispatch(addUser(user)));
            room.messages.map((message) => dispatch(addMessage(message)));

            socket.removeAllListeners();

            socket.on(SERVER_EVENTS.USER_JOIN, handleUserJoin);
            socket.on(SERVER_EVENTS.USER_LEAVE, handleUserLeave);
            socket.on(SERVER_EVENTS.MESSAGE_NEW, handleMessageNew);
            socket.on(SERVER_EVENTS.MESSAGE_REMOVE, handleMessageRemove);

            return () => {
                dispatch(clearUsers());
                dispatch(clearMessages());
            };
        },
        [
            dispatch,
            handleMessageNew,
            handleMessageRemove,
            handleUserJoin,
            handleUserLeave,
            router,
            socket,
        ]
    );

    function scrollToBottom() {
        const element = messageListRef?.current;
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    useEffect(() => {
        socket.emit(SERVER_EVENTS.ROOM_JOIN, roomId, handleJoinRoom);
        return () => {
            socket.emit(SERVER_EVENTS.ROOM_LEAVE, roomId);
        };
    }, [roomId, socket, handleJoinRoom]);

    useEffect(scrollToBottom);

    if (!room) {
        return <p>chargement de la room en cours</p>;
    }

    console.log(room);

    return (
        <div className={styles["app"]}>
            <UserList />
            <div className={styles["container"]}>
                <div className={styles["header"]}>
                    <h4>
                        {room.name} ({messages.length} messages)
                    </h4>
                    <CallManager socket={socket} />
                </div>
                <MessageList innerRef={messageListRef} />
                <ControlsInput socket={socket} />
            </div>
        </div>
    );
}

export async function getServerSideProps({ query }) {
    const roomId = query?.roomId?.[0] as undefined | string;
    return {
        props: { roomId },
    };
}

Rooms.authRequired = true;
export default Rooms;
