import Link from "next/link";
import { Socket } from "socket.io-client";

import styles from "../styles/home.module.scss";

function Index({ rooms }: { socket: Socket; rooms: Room[] }) {
    return (
        <div className={styles["app"]}>
            <h1>Rooms</h1>
            {rooms && (
                <ul>
                    {rooms.map((room, key) => (
                        <li key={key}>
                            <div>
                                {room.name} ({room.users.length} users)
                            </div>
                            <div>
                                <Link href={`/rooms/${room.id}`}>Join</Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

Index.authRequired = true;
export default Index;
