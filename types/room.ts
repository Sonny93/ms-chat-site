import { Producer } from "mediasoup-client/lib/Producer";
import { Transport } from "mediasoup-client/lib/Transport";
import { Message } from "./message";
import { User } from "./user";

export interface RoomProducer {
    producerId: Producer["id"];
    userId: User["id"];
}
export interface Room {
    id: string;
    name: string;
    messages: Message[];
    users: User[];
    transports: Transport["id"];
    producers: RoomProducer[];
}
