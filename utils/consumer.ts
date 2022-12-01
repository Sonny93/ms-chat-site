import { RtpCapabilities, RtpParameters } from "mediasoup-client/lib/types";
import { Socket } from "socket.io-client";

import { SERVER_EVENTS } from "../types/events";

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
            SERVER_EVENTS.CONSUME_MEDIA,
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
