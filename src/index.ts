import Socket from "./socket.js";
import User, * as UserUtils from "./user.js";
import "./room.js";

const socketServer = Socket.getInstance();
socketServer.start(3000).then(() => {
    console.log("started server");
});

UserUtils.connect(socketServer);