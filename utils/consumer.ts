import { RtpCapabilities, RtpParameters } from "mediasoup-client/lib/types";
import { Socket } from "socket.io-client";

interface consumeMediaProps {
    socket: Socket;
    clientRtpCapabilities: RtpCapabilities;
    producerId: string;
}

export async function consumeMedia({
    socket,
    clientRtpCapabilities,
    producerId,
}: consumeMediaProps): Promise<{
    consumerId: string;
    rtpParameters: RtpParameters;
}> {
    return new Promise((resolve, reject) => {
        socket.emit(
            "consumeMedia",
            { clientRtpCapabilities, producerId },
            ({ error, consumerId, rtpParameters }) => {
                if (error) {
                    return reject(error);
                } else {
                    return resolve({ consumerId, rtpParameters });
                }
            }
        );
    });
}
