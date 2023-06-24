import { WebSocket } from "ws";
import Socket from "./socket";
import { UserMessageType } from "./types/user-messages";
import { randomString } from "./utils.js";

export function connect(socket: Socket) {
    socket.get().on("connection", client => {
        new User(client);
    });
}

export type eventId = "connect" | "disconnect";
const EVENT_IDS: eventId[] = ["connect", "disconnect"];


export default class User {
    private static users: User[] = [];

    public static getAll() {
        return [...this.users];
    }

    private static eventListeners: Map<string, ((user: User) => void)[]> = new Map();
    static {
        for (let event of EVENT_IDS) {
            this.eventListeners.set(event, []);
        }
    }

    private messageListeners: UserMessageType[] = [];
    private id = "User " + randomString(3);

    constructor(public readonly socket: WebSocket) {
        User.users.push(this);

        this.socket.addEventListener("close", () => {
            User.dispatchEvent("disconnect", this);
            const index = User.users.indexOf(this);
            if (index >= 0) {
                User.users.splice(index, 1);
            }
            this.messageListeners.splice(0, this.messageListeners.length);
        }, { once: true });

        this.socket.addEventListener("message", msg => {
            try {
                const json = JSON.parse(msg.data.toString());
                const type = json.type;
                if (typeof type != "string") throw "malformed message";
                this.handleMessage(type, json.data);
            } catch {}
        });

        User.dispatchEvent("connect", this);

        this.addMessageListener({
            id: "avatar",
            callback: avatar => {
                this.id = avatar;
            }
        });
    }

    public getId() {
        return this.id;
    }

    public addMessageListener(listener: UserMessageType) {
        if (this.messageListeners.includes(listener)) return;
        this.messageListeners.push(listener);
    }
    
    public removeMessageListener(listener: UserMessageType) {
        const index = this.messageListeners.indexOf(listener);
        if (index >= 0) {
            this.messageListeners.splice(index, 1);
        }
    }

    public static addEventListener(event: eventId, callback: (user: User) => void) {
        const listeners = this.eventListeners.get(event)!;
        if (!listeners.includes(callback)) {
            listeners.push(callback);
        }
    }

    public static removeEventListener(event: eventId, callback: (user: User) => void) {
        const listeners = this.eventListeners.get(event)!;
        const index = listeners.indexOf(callback);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }

    private static dispatchEvent(event: eventId, user: User) {
        const listeners = this.eventListeners.get(event)!;
        for (let callback of listeners) {
            callback(user);
        }
    }

    public send(type: string, data?: any) {
        this.socket.send(JSON.stringify({
            type,
            data
        }));
    }

    public error(message: string) {
        this.send("error", message);
    }

    private handleMessage(type: string, data?: any) {

        if (type == "create room") {
            const url = typeof data == "string" ? data : undefined;
            for (let l of this.messageListeners) {
                if (l.id == "create room") {
                    l.callback(url);
                }
            }
            return;
        }

        if (type == "join room") {
            if (typeof data != "string") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "join room") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "url") {
            if (typeof data != "string") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "url") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "leave") {
            for (let l of this.messageListeners) {
                if (l.id == "leave") {
                    l.callback();
                }
            }
            return;
        }

        if (type == "chat") {
            if (typeof data != "string") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "chat") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "buffering") {
            if (typeof data != "boolean") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "buffering") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "paused") {
            if (typeof data != "boolean") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "paused") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "timestamp") {
            if (typeof data != "number") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "timestamp") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "sound") {
            if (typeof data != "string") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "sound") {
                    l.callback(data);
                }
            }
            return;
        }

        if (type == "avatar") {
            if (typeof data != "string") throw "invalid data";

            for (let l of this.messageListeners) {
                if (l.id == "avatar") {
                    l.callback(data);
                }
            }
            return;
        }

        console.error(`Unknown packet type '${type}'`);
    }
}