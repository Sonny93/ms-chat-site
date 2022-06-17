import { RtpCapabilities } from 'mediasoup-client/lib/types';

interface consumeMediaProps {
    userId: string;
    clientRtpCapabilities: RtpCapabilities;
    producerId: string;
}

export async function consumeMedia({ userId, clientRtpCapabilities, producerId }: consumeMediaProps) {
    const options = {
        method: 'POST',
        body: JSON.stringify({
            userId,
            clientRtpCapabilities,
            producerId
        }),
        headers: { 'Content-Type': 'application/json' }
    } as RequestInit;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consumeMedia`, options);
    const data = await response.json();

    return data;
}