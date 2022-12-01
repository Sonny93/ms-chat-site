import {
    MediaKind,
    RtpCapabilities,
    RtpParameters,
} from "mediasoup-client/lib/types";
import { Socket } from "socket.io-client";

import { SERVER_EVENTS } from "../types/events";

interface ProduceMediaProps {
    socket: Socket;
    rtpParameters: RtpParameters;
    clientRtpCapabilities: RtpCapabilities;
    kind: MediaKind;
}

export async function produceMedia({
    socket,
    rtpParameters,
    clientRtpCapabilities,
    kind,
}: ProduceMediaProps): Promise<string> {
    return new Promise((resolve, reject) => {
        socket.emit(
            SERVER_EVENTS.PRODUCE_MEDIA,
            { rtpParameters, clientRtpCapabilities, kind },
            ({ error, produceId }) => {
                if (error) {
                    return reject(error);
                } else {
                    resolve(produceId);
                }
            }
        );
    });
}
