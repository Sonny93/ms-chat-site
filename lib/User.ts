import io, { Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default class User {
    username: string;
    socket: Socket;
    sendTransport: any;
    recvTransport: any;

    constructor({ username }) {
        if (!username) {
            throw new Error('Missng username');
        } else {
            this.username = username;
        }

        const socket = io(API_URL, { query: { username } });
        socket.on('connect', () => { })
        this.socket = socket;
    }

    private handleConnected = () => {
        console.log('[Socket]', 'Connected', this.socket.connected);
        console.log('[Transport]', 'Initialisation');
    }
}