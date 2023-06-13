import { WebSocket } from "ws";

const client = new WebSocket("ws://127.0.0.1:3000");

client.on("open", () => {
    console.log("connected!");

    client.send(JSON.stringify({
        type: "create room"
    }));
});