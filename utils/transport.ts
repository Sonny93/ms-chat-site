import { Device } from 'mediasoup-client';
import { DtlsParameters, Transport } from 'mediasoup-client/lib/Transport';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface connectTransportProps {
    userId: string;
    dtlsParameters: DtlsParameters;
    type: 'send' | 'recv';
}
export async function connectTransport({ userId, dtlsParameters, type }: connectTransportProps): Promise<{ id: string; }> {
    const options = {
        method: 'POST',
        body: JSON.stringify({
            userId,
            dtlsParameters
        }),
        headers: { 'Content-Type': 'application/json' }
    } as RequestInit;

    if (type !== 'recv' && type !== 'send') {
        throw new Error('Wrong transport type, expected send or recv but got' + type);
    }

    const response = await fetch(`${API_URL}/transport/connect/${type}`, options);
    const data = await response.json();

    return data;
}

export interface createTransportProps {
    userId: string;
    device: Device;
    type: 'send' | 'recv';
}
export async function createTransport({ userId, device, type }: createTransportProps): Promise<Transport> {
    const options = {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: { 'Content-Type': 'application/json' }
    } as RequestInit;

    const response = await fetch(`${API_URL}/transport/create/${type}`, options);
    const data = await response.json();

    let transport: Transport;
    if (type === 'send') {
        transport = device.createSendTransport(data.transport);
    } else if (type === 'recv') {
        transport = device.createRecvTransport(data.transport);
    } else {
        throw new Error('Wrong transport type, expected send or recv but got' + type);
    }

    return transport;
}