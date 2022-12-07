import { configureStore, createSlice } from "@reduxjs/toolkit";
import { Message } from "../types/message";
import { User } from "../types/user";

const userSlice = createSlice({
    name: "users",
    initialState: [] as User[],
    reducers: {
        addUser: (state: User[], { payload }: { payload: User }) => {
            const users = [...state];
            users.push(payload);
            return users;
        },
        updateUser: (state: User[], { payload }: { payload: User }) => {},
        removeUser: (state: User[], { payload }: { payload: User }) => {
            const users = [...state];

            const userIndex = users.findIndex((u) => u.id === payload.id);
            if (userIndex !== -1) {
                users.splice(userIndex, 1);
            }

            return users;
        },

        clearUsers: () => [],
    },
});
export const { addUser, updateUser, removeUser, clearUsers } =
    userSlice.actions;

const messageSlice = createSlice({
    name: "messages",
    initialState: [] as Message[],
    reducers: {
        addMessage: (state: Message[], { payload }: { payload: Message }) => {
            const messages = [...state];
            messages.push(payload);
            return messages;
        },
        removeMessage: (
            state: Message[],
            { payload }: { payload: Message }
        ) => {
            const messages = [...state];

            const messageIndex = messages.findIndex((u) => u.id === payload.id);
            if (messageIndex !== -1) {
                messages.splice(messageIndex, 1);
            }

            return messages;
        },

        clearMessages: () => [],
    },
});
export const { addMessage, removeMessage, clearMessages } =
    messageSlice.actions;

export const store = configureStore({
    reducer: {
        users: userSlice.reducer,
        messages: messageSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});
