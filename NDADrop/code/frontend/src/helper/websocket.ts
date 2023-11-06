import { websocketNonSecureURL, websocketSecureURL } from "../const";
import PeerConnection from "./peerConnection";

type SignalMessage = {
    type: String,
    sender: String,
    receiver: String,
    data: String
};

export default class SignalingWebsocket {
    constructor(
        onNewUser: (user: String, signaling_ws: SignalingWebsocket, can_send_offer: boolean) => void,
        onRemoveUser: (user: String) => void,
        onOffer: (offer: String, sender: String, signaling_ws: SignalingWebsocket) => void,
        onAnswer: (answer: String, sender: String) => void,
        onICE: (ice: String, sender: String) => void) {
        this.ws = undefined;
        this.send_buffer = [];
        this.create_websocket(onNewUser, onRemoveUser, onOffer, onAnswer, onICE).then((ws) => {
            this.ws = ws;
            this.send_buffer.forEach((msg) => {
                ws?.send(JSON.stringify(msg));
            });
        });
    }

    wsSend(msg: SignalMessage) {
        if (this.ws === undefined) {
            this.send_buffer.push(msg);
        } else {
            this.ws.send(JSON.stringify(msg));
        }
    }

    sendOffer(pc: PeerConnection, offer: string) {
        let message = {
            type: "offer_sdp",
            sender: pc.myUserName,
            receiver: pc.otherUserName,
            data: offer
        };
        this.wsSend(message);
    }
    sendICE(pc: PeerConnection, ice: string) {
        let message = {
            type: "ice",
            sender: pc.myUserName,
            receiver: pc.otherUserName,
            data: ice
        };
        this.wsSend(message);
    }
    sendAnswer(pc: PeerConnection, answer: string) {
        let message = {
            type: "answer_sdp",
            sender: pc.myUserName,
            receiver: pc.otherUserName,
            data: answer
        };
        this.wsSend(message);
    }

    create_websocket(onNewUser: (user: String, signaling_ws: SignalingWebsocket, can_send_offer: boolean) => void,
        onRemoveUser: (user: String) => void,
        onOffer: (offer: String, sender: String, signaling_ws: SignalingWebsocket) => void,
        onAnswer: (answer: String, sender: String) => void,
        onICE: (ice: String, sender: String) => void): Promise<WebSocket> {

        let websocket_url = "";
        if (window.location.protocol === "https:") {
            websocket_url = websocketSecureURL;
        } else {
            websocket_url = websocketNonSecureURL;
        }
        
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(websocket_url);
            ws.onclose = () => console.log("Websocket closed");
            ws.onerror = (err) => {
                console.log("Websocket error:", err);
                reject(ws);
            };
            ws.onmessage = (msg) => {
                console.log("Websocket message received:", String(msg.data));
                //Need to check if RTCPeerConnection needed
                let data = JSON.parse(msg.data);

                this.onRecv(data, onNewUser, onRemoveUser, onOffer, onAnswer, onICE);
            };
            ws.onopen = () => {
                console.log("Websocket open");
                resolve(ws);
            };
        });
    };

    onRecv(data: SignalMessage, onNewUser: (user: String, signaling_ws: SignalingWebsocket, can_send_offer: boolean) => void,
        onRemoveUser: (user: String) => void,
        onOffer: (offer: String, sender: String, signaling_ws: SignalingWebsocket) => void,
        onAnswer: (answer: String, sender: String) => void,
        onICE: (ice: String, sender: String) => void) {
        if (data.type === "answer_sdp") {
            let sender = data.sender;
            let sdp = data.data;
            onAnswer(sdp, sender);
        } else if (data.type === "ice") {
            let sender = data.sender;
            let ice = data.data;
            onICE(ice, sender);
        } else if (data.type === "offer_sdp") {
            let sender = data.sender;
            let offer = data.data;
            onOffer(offer, sender, this);
        } else if (data.type === "new_user") {
            let name = data.sender;
            let bool1 = data.data === 'true';
            onNewUser(name, this, bool1);
        } else if (data.type === "remove_user") {
            onRemoveUser(data.sender);
        }
    }

    sendUserName(userName: String) {
        console.log("checking " + userName);

        let message = {
            type: "set_username",
            sender: userName,
            receiver: "",
            data: userName
        };
        this.wsSend(message);
    }

    ws: WebSocket | undefined;
    send_buffer: SignalMessage[];
};
