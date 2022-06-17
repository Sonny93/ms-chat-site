import { MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/types';

interface ProduceMediaProps {
    userId: string;
    rtpParameters: RtpParameters;
    clientRtpCapabilities: RtpCapabilities;
    kind: MediaKind;
}

export async function produceMedia({ userId, rtpParameters, clientRtpCapabilities, kind }: ProduceMediaProps): Promise<{ id: string; }> {
    const options = {
        method: 'POST',
        body: JSON.stringify({
            userId,
            rtpParameters,
            clientRtpCapabilities,
            kind
        }),
        headers: { 'Content-Type': 'application/json' }
    } as RequestInit;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/produceMedia`, options);
    const data = await response.json();

    return data;
}