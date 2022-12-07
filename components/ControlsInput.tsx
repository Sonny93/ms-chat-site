import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Socket } from "socket.io-client";

import { addMessage } from "../lib/Redux";
import { SERVER_EVENTS } from "../types/events";
import { Message } from "../types/message";

import styles from "../styles/chat.module.scss";

export default function ControlsInput({ socket }: { socket: Socket }) {
    const [value, setValue] = useState<string>("");
    const dispatch = useDispatch();

    const sendMessage = useCallback(() => {
        if (!value.trim()) return;

        socket.emit(
            SERVER_EVENTS.MESSAGE_SEND,
            value.trim(),
            ({ error, message }: { error: string; message: Message }) => {
                if (error) return console.error(error);

                dispatch(addMessage(message));
                setValue("");
            }
        );
    }, [value, socket, dispatch]);

    const handleOnKeyDown = ({ key }) =>
        key === "Enter" ? sendMessage() : null;

    return (
        <div className={styles["controls"]}>
            <input
                type="text"
                name="input-message"
                id="input-message"
                placeholder="Votre message..."
                onKeyDown={handleOnKeyDown}
                onChange={({ target }) => setValue(target.value)}
                value={value}
            />
        </div>
    );
}
