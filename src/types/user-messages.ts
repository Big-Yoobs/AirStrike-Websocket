export interface UserMessage {
    id: string
    callback: (...params: any[]) => void
}


export interface UserMessageCreateRoom extends UserMessage {
    id: "create room"
    callback: () => void
}

export interface UserMessageJoinRoom extends UserMessage {
    id: "join room"
    callback: (roomId: string) => void
}

export interface UserMessageUrl extends UserMessage {
    id: "url"
    callback: (url: string) => void
}

export interface UserMessageLeave extends UserMessage {
    id: "leave"
    callback: () => void
}

export interface UserMessageChat extends UserMessage {
    id: "chat"
    callback: (chatMessage: string) => void
}

export interface UserMessageBuffering extends UserMessage {
    id: "buffering"
    callback: (isBuffering: boolean) => void
}

export interface UserMessagePaused extends UserMessage {
    id: "paused"
    callback: (isPaused: boolean) => void
}

export interface UserMessageTimestamp extends UserMessage {
    id: "timestamp"
    callback: (timestamp: number) => void
}

export interface UserMessageSound extends UserMessage {
    id: "sound",
    callback: (soundId: string) => void
}


export type UserMessageType = UserMessageCreateRoom | UserMessageJoinRoom | UserMessageUrl | UserMessageLeave | UserMessageChat | UserMessageBuffering | UserMessagePaused | UserMessageTimestamp | UserMessageSound;