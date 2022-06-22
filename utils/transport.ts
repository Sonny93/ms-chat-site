import { Device } from 'mediasoup-client';
import { DtlsParameters, Transport } from 'mediasoup-client/lib/Transport';
import { Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface connectTransportProps {
    dtlsParameters: DtlsParameters;
    direction: 'send' | 'recv';
    socket: Socket;
}
export function connectTransport({ dtlsParameters, direction, socket }: connectTransportProps): Promise<{ transportId: string; }> {
    return new Promise((resolve, reject) => {
        if (direction !== 'recv' && direction !== 'send') {
            return reject('Wrong transport direction, expected send or recv but got ' + direction);
        }

        socket.emit('transport-connect', { direction, dtlsParameters }, ({ error, transportId }) => {
            if (error) {
                return reject(error);
            } else {
                return resolve(transportId);
            }
        })
    });
}

export interface createTransportProps {
    device: Device;
    direction: 'send' | 'recv';
    socket: Socket;
}
export function createTransport({ device, direction, socket }: createTransportProps): Promise<Transport> {
    return new Promise((resolve, reject) => {
        socket.emit('transport-create', { direction: direction }, ({ error, transport }) => {
            if (error) {
                return reject(error);
            } else if (direction === 'send') {
                return resolve(device.createSendTransport(transport));
            } else if (direction === 'recv') {
                return resolve(device.createRecvTransport(transport));
            } else {
                return reject('Wrong transport direction, expected send or recv but got' + direction);
            }
        });
    });
}