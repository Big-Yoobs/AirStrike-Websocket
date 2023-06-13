import { WebSocketServer } from "ws";

export default class Socket {
    private static instance: Socket;
    private wss: WebSocketServer | undefined;

    public static getInstance() {
        if (!this.instance) this.instance = new Socket();
        return this.instance;
    }

    public get() {
        if (!this.wss) throw "Socket has not yet been created.";
        return this.wss;
    }

    public start(port: number) {
        return new Promise<WebSocketServer>((resolve, reject) => {
            let complete = false;

            this.wss = new WebSocketServer({
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
                if (complete) return;
                complete = true;
                resolve(this.wss!);
            });

            this.wss.once("error", e => {
                if (complete) return;
                complete = true;
                reject(e);
            })
        })
    }
}