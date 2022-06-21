import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Socket } from 'socket.io-client';
import { addMessage } from '../lib/Redux';
import styles from '../styles/chat.module.scss';

export default function ControlsInput({ socket }: { socket: Socket; }) {
    const [value, setValue] = useState<string>('');
    const dispatch = useDispatch();

    const sendMessage = useCallback(() => {
        if (!value.trim()) return;

        socket.emit('message', value.trim(), ({ error, message }: { error: string; message: Message; }) => {
            if (error) return console.error(error);

            dispatch(addMessage(message));
            setValue('');
        });
    }, [value, socket, dispatch]);

    const handleOnKeyDown = ({ key }) => key === 'Enter' ? sendMessage() : null;

    function spamMessage() {
        const inter = setInterval(() => {
            const val = new Array(500)
                .join()
                .replace(/(.|$)/g, () => ((Math.random() * 36) | 0).toString(36)[Math.random() < .5 ? 'toString' : 'toUpperCase']());
            socket.emit('message', val, ({ error, message }) => !error ? dispatch(addMessage(message)) : console.error(error));
        });
        setTimeout(() => clearInterval(inter), 1000);
    }

    return (<>
        <div className={styles['controls']}>
            <input
                type='text'
                name='input-message'
                id='input-message'
                placeholder='Votre message...'
                onKeyDown={handleOnKeyDown}
                onChange={({ target }) => setValue(target.value)}
                value={value}
            />
        </div>
    </>)
}