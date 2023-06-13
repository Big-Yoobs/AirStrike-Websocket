import Socket from "./socket.js";
import User, * as UserUtils from "./user.js";
import Room from "./room.js";

const socketServer = Socket.getInstance();
socketServer.start(3000).then(() => {
    console.log("started server");
});

UserUtils.connect(socketServer);

User.addEventListener("connect", user => {
    console.log("User connected!");

    user.addMessageListener({
        id: "create room",
        callback: () => {
            console.log("User wants to create room!");
        }
    })
});

User.addEventListener("disconnect", () => {
    console.log("User disconnected!");
});

console.log(Room);