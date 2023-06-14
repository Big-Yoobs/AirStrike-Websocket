import User from "./user";

export default class RoomMember {
    public isBuffering = false;

    constructor(
        public readonly user: User
    ) {}
}