import RoomMember from "./room-member.js";
import User from "./user.js";
import { randomString } from "./utils.js";

export class Room {
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
                    const room = this.rooms.get(roomId.toUpperCase());
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
                    if (room.owner.user != user) {
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

            user.addMessageListener({
                id: "buffering",
                callback: isBuffering => {
                    const room = this.getUserRoom(user);
                    if (!room) {
                        return user.error("You're not in a room");
                    }
                    const member = room.getMember(user);
                    if (!member) {
                        return user.error("You're not in a room");
                    }
                    member.isBuffering = isBuffering;
                    room.sendBufferEvent();
                }
            });

            user.addMessageListener({
                id: "paused",
                callback: isPaused => {
                    const room = this.getUserRoom(user);
                    if (!room) {
                        return user.error("You're not in a room");
                    }
                    if (room.owner.user != user) {
                        return user.error("You're not the owner of the room");
                    }
                    room.paused = isPaused;
                    room.dispatchEvent("paused", room.paused);
                }
            });

            user.addMessageListener({
                id: "timestamp",
                callback: timestamp => {
                    const room = this.getUserRoom(user);
                    if (!room) {
                        return user.error("You're not in a room");
                    }
                    if (room.owner.user != user) {
                        return user.error("You're not the owner of the room");
                    }
                    room.timestamp = timestamp;
                    room.dispatchEvent("timestamp", room.timestamp);
                }
            })
        });
    }

    static getUserRoom(user: User) {
        for (let room of this.rooms.values()) {
            if (room.members.map(member => member.user).includes(user)) {
                return room;
            }
        }
        return null;
    }


    public readonly id: string;
    private members: RoomMember[] = [];
    private url: string | null = null;
    private timestamp = 0;
    private paused = false;
    private owner: RoomMember;
    private active = true;

    private constructor(owner: User) {
        let roomId;
        let tries = 0;
        do {
            roomId = randomString(4 + Math.floor(tries++ / 10));
        } while (Room.rooms.has(roomId));
        this.id = roomId;
        Room.rooms.set(this.id, this);
        this.owner = new RoomMember(owner);
        this.members.push(this.owner);
        setTimeout(() => {
            if (this.active) {
                this.sendChat(`Welcome to room ${this.id}.`);
            }
        }, 1000);
    }

    private dispatchEvent(type: string, data?: any) {
        for (let member of this.members) {
            member.user.send(type, data);
        }
    }

    public addUser(user: User) {
        if (Room.getUserRoom(user)) {
            throw "You're already in a room";
        }
        this.members.push(new RoomMember(user));
        user.send("url", {
            room: this.id,
            url: this.url
        });
        this.sendBufferEvent();
        user.send("paused", this.paused);
        user.send("timestamp", this.timestamp);
        this.sendChat(`${user.id} joined the room.`);
    }

    public removeUser(user: User) {
        const member = this.getMember(user);
        if (!member) throw "You're not in a room";
        const index = this.members.indexOf(member);
        if (index < 0) return;
        this.members.splice(index, 1);
        user.send("room ID", null);

        if (this.owner.user == user) {
            if (this.members.length) {
                this.owner = this.members[0];
                this.sendBufferEvent();
                this.sendChat(`${user.id} left the room. ${this.owner.user.id} has been promoted to owner.`);
            } else {
                Room.rooms.delete(this.id);
                this.active = false;
            }
        } else {
            this.sendChat(`${user.id} left the room.`);
        }
    }

    public setUrl(url: string) {
        if (this.url == url) return;
        this.url = url;
        this.timestamp = 0;
        this.paused = false;
        this.dispatchEvent("url", {
            room: this.id,
            url: this.url
        });
        this.dispatchEvent("timestamp", 0);
        this.dispatchEvent("paused", false);
    }

    public sendChat(message: string, sender?: User) {
        this.dispatchEvent("chat", {
            sender: sender ? sender.id : "system",
            message
        });
    }

    public getMember(user: User) {
        const member = this.members.filter(member => member.user == user).shift();
        return member || null;
    }

    public sendBufferEvent() {
        let shouldBuffer = false;
        for (let member of this.members) {
            if (member.isBuffering) {
                shouldBuffer = true;
                break;
            }
        }
        this.dispatchEvent("buffering", shouldBuffer);
    }
}