import User from "./user.js";
import { randomString } from "./utils.js";

export default class Room {
    private static rooms: Map<string, Room> = new Map();

    static {
        function userLeave(user: User) {
            const room = Room.getUserRoom(user);
            if (!room) {
                return user.error("You're not in a room");
            }
            room.removeUser(user);
        }

        User.addEventListener("disconnect", userLeave);

        User.addEventListener("connect", user => {

            user.addMessageListener({
                id: "create room",
                callback: () => {
                    const room = new Room(user);
                    user.send("room ID", room.id);
                }
            });

            user.addMessageListener({
                id: "join room",
                callback: roomId => {
                    const room = this.rooms.get(roomId);
                    if (!room) {
                        return user.error("That room doesn't exist");
                    }
                    room.addUser(user);
                }
            });

            user.addMessageListener({
                id: "leave",
                callback: () => userLeave(user)
            });

            user.addMessageListener({
                id: "url",
                callback: url => {
                    const room = this.getUserRoom(user);
                    if (!room) {
                        return user.error("You're not in a room");
                    }
                    if (room.owner != user) {
                        return user.error("You're not the owner of the room");
                    }
                    room.setUrl(url);
                }
            });

            user.addMessageListener({
                id: "chat",
                callback: message => {
                    const room = this.getUserRoom(user);
                    if (!room) {
                        return user.error("You're not in a room");
                    }
                    room.sendChat(message, user);
                }
            });
        });
    }

    static getUserRoom(user: User) {
        for (let room of this.rooms.values()) {
            if (room.members.includes(user)) {
                return room;
            }
        }
        return null;
    }


    public readonly id: string;
    private members: User[] = [];
    private url: string | null = null;

    private constructor(private owner: User) {
        let roomId;
        let tries = 0;
        do {
            roomId = randomString(4 + Math.floor(tries++ / 10));
        } while (Room.rooms.has(roomId));
        this.id = roomId;
        Room.rooms.set(this.id, this);
        this.members.push(owner);
        console.log("created room with ID", this.id);
    }

    private dispatchEvent(type: string, data?: any) {
        for (let user of this.members) {
            user.send(type, data);
        }
    }

    public addUser(user: User) {
        if (Room.getUserRoom(user)) {
            throw "You're already in a room";
        }
        this.members.push(user);
    }

    public removeUser(user: User) {
        const index = this.members.indexOf(user);
        if (index < 0) {
            throw "You're not in a room";
        }
        this.members.splice(index, 1);
        if (this.owner == user) {
            if (this.members.length) {
                this.owner = this.members[0];
            } else {
                console.log("deleting room!");
                Room.rooms.delete(this.id);
            }
        }
    }

    public setUrl(url: string) {
        if (this.url == url) return;
        this.url = url;
        this.dispatchEvent("url", url);
    }

    public sendChat(message: string, sender?: User) {
        this.dispatchEvent("chat", message); // todo: add system messages
    }
}