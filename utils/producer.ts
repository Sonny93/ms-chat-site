import { MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/types';
import { Socket } from 'socket.io-client';

interface ProduceMediaProps {
    socket: Socket;
    rtpParameters: RtpParameters;
    clientRtpCapabilities: RtpCapabilities;
    kind: MediaKind;
}

export async function produceMedia({ socket, rtpParameters, clientRtpCapabilities, kind }: ProduceMediaProps): Promise<string> {
    return new Promise((resolve, reject) => {
        socket.emit('produceMedia', { rtpParameters, clientRtpCapabilities, kind }, ({ error, produceId }) => {
            if (error) {
                return reject(error);
            } else {
                resolve(produceId);
            }
        });
    });
}