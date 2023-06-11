import WebSocket, { WebSocketServer } from "ws";

const port = 13933;

const wss = new WebSocketServer({
    port,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
}, () => {
    console.log(`Started server on 127.0.0.1:${port}`);
});

const rooms = new Map();

function randomString(length) {
    let result = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

wss.on("connection", (ws, req) => {
    const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;
    console.log("Socket joined at", ip);

    let room = false;

    ws.on("error", console.error);

    function sendMessage(messageType, data = undefined) {
        ws.send(JSON.stringify({
            type: messageType,
            data
        }));
    }

    const self = {
        websocket: ws,
        send: sendMessage
    }

    ws.on("message", data => {
        try {
            const message = JSON.parse(data);

            if (typeof message?.type != "string") throw `Invalid message type '${message?.type}'`;

            switch (message.type) {
                case "create room":
                    if (room) throw "Already in room";

                    let roomId;
                    let tries = 0;
                    do {
                        roomId = randomString(4 + Math.floor(tries++ / 10));
                    } while (rooms.has(roomId));

                    room = {
                        id: roomId,
                        url: null,
                        users: [self],
                        owner: self
                    }
                    rooms.set(roomId, room);
                    sendMessage("room ID", roomId);
                    break;

                case "join room":
                    if (room) throw "Already in room";
                    if (typeof message.data != "string") throw "Missing room ID";
                    message.data = message.data.toUpperCase();

                    const roomInfo = rooms.get(message.data);
                    if (!roomInfo) throw "Room does not exist";

                    if (roomInfo.users.includes(self)) throw "Already in room";
                    roomInfo.users.push(self);
                    room = roomInfo;

                    sendMessage("url", {
                        room: room.id,
                        url: roomInfo.url
                    });
                    break;

                case "url":
                    if (!room) throw "Not in room";
                    const url = message.data;
                    if (url !== null && typeof url != "string") throw "Invalid url";
                    if (room.owner != self) throw "Unauthorized";
                    if (url == room.url) throw "Already set";
                    room.url = url;
                    for (let user of room.users) {
                        if (user != self) {
                            user.send("url", url);
                        }
                    }
                    break;

                case "leave":
                    if (!room) throw "Not in room";
                    const index = room.users.indexOf(self);
                    if (index >= 0) room.users.splice(index, 1);

                    if (room.owner == self) {
                        for (let user of room.users) {
                            if (user != self) {
                                user.send("leave");
                            }
                        }
                        rooms.delete(room.id);
                    }
                    room = false;
                    break;

                case "chat":
                    if (!room) throw "Not in room";
                    const chat = message.data;
                    if (typeof chat != "string") throw "Not string";
                    for (let user of room.users) {
                        if (user != self) {
                            user.send("chat", chat);
                        }
                    }
                    break;

                default:
                    throw `Unknown message type ${message.type}`;
            }
        } catch (e) {
            if (typeof e == "string") {
                sendMessage("error", e);
            } else {
                console.error(e);
            }
        }
    });
});



// function newWebsocket() {
//     const ws = new WebSocket("ws://127.0.0.1:" + port);

//     ws.sendJson = (messageType, data = undefined) => {
//         ws.send(JSON.stringify({
//             type: messageType,
//             data
//         }));
//     }

//     ws.on("message", message => {
//         try {
//             const data = JSON.parse(message.toString());
//             if (ws.onData) ws.onData(data);
//         } catch (e) {
//             console.error(e);
//         }
//     });

//     return ws;
// }

// const ws1 = newWebsocket();
// ws1.onData = data => {

//     if (data.type == "room ID") {
//         console.log(data.data);

//         const ws2 = newWebsocket();
//         ws2.onData = data => {
//             console.log(data);
//             if (data.type == "url" && !data.data) {
//                 ws1.sendJson("url", "ergher0gireg");
//             }
//         }
//         ws2.on("open", () => {
//             console.log("open");
//             ws2.sendJson("join room", data.data);
//         });

//     }
// }
// ws1.on("open", () => {
//     ws1.sendJson("create room");
// });

// setTimeout(() => {
//     ws1.sendJson("leave");
// }, 1000);
