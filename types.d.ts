interface Room {
    id: string;
    name: string;
    messages: Message[];
    users: User[];
}

interface Message {
    id: string;
    author: User;
    content: string;
}

interface User {
    id: string;
    username: string;
    avatar: string;
}