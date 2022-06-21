import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import io, { Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SocketManager({ Component, pageProps }) {
    const { data: session } = useSession();

    const [socket, setSocket] = useState<Socket | null>();
    const [rooms, setRooms] = useState(null);

    const handleConnected = () => console.log('[Socket]', 'Connected');
    const handleRooms = (rooms) => setRooms(rooms);

    useEffect(() => {
        const newSocket = io(API_URL, {
            query: {
                username: session.user.name,
                avatar: session.user.image
            }
        });
        setSocket(newSocket);

        newSocket.on('connect', handleConnected);
        newSocket.on('rooms', handleRooms);

        return () => {
            newSocket.off('connect', handleConnected);
            newSocket.off('rooms', handleRooms);
            newSocket.close();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!socket || socket.connected === false) {
        return (<>
            <div className='app' style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Connexion au serveur de socket en cours</p>
            </div>
        </>)
    }

    return (<>
        <Component
            {...pageProps}
            socket={socket}
            rooms={rooms}
        />
    </>)
}