import Socket from "./socket.js";
import * as UserUtils from "./user.js";
import "./room.js";
import * as FS from "fs";

if (!FS.existsSync("./config.json")) {
    FS.cpSync("./assets/config-template.json", "./config.json");
}

const CONFIG = JSON.parse(FS.readFileSync("./config.json", "utf-8"));

const socketServer = Socket.getInstance();
socketServer.start(CONFIG.port).then(() => {
    console.log(`started server on *:${CONFIG.port}`);
});

UserUtils.connect(socketServer);