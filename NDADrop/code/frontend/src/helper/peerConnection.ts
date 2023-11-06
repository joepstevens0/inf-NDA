import SignalingWebsocket from "./websocket";
import { BUFFER_THRESHOLD, LAST_DATA_OF_FILE, MAXIMUM_SIZE_DATA_TO_SEND } from "../index";
import { downloadFile, getCompleteFile } from "./download";


const pcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const dataChannelOptions: RTCDataChannelInit = {
ordered: true, // guarantee order
maxPacketLifeTime: 3000, // in milliseconds
protocol: "tcp"
};

export type ChatMessage = {
    sender: String;
    data: String;
    type: ChatMessageType;
};

export enum ChatMessageType{
    Message,
    FileTransfer
};


export enum PeerConnectionState {
    Start,
    SendingOffer,
    AwaitingAnswer,
    ExchangingICE,
    Connection
};
export default class PeerConnection {
    constructor(otherUserName: String,myUserName: String, websocket: SignalingWebsocket){
        this.myUserName = myUserName;
        this.otherUserName = otherUserName;
        
        this.chatChannel = null;
        this.fileChannel = null
        this.peerConnection = new RTCPeerConnection(pcConfig);
        this.state = PeerConnectionState.Start;
        this.ICEBuffer = [];
        console.log("GOOD WEBSOCKET GOT>??????", websocket);
        this.websocket = websocket;
        this.paused = false;
        this.fileQueue = [];
        this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            console.log("ice send websocket:", this);
            if (event.candidate) {
                let candidate = event.candidate;
                // send ice via websocket to others
                this.websocket.sendICE(this,JSON.stringify(candidate));
            }
        };
    }

    close(){
        this.peerConnection.close()
    }

    create_as_sender(onData: (data: String) => void){
        console.log("create sender");
        
        // create data channel
        this.chatChannel = this.peerConnection.createDataChannel("chat", dataChannelOptions);
        this.chatChannel.onopen = () => {
            console.log("Chat channel opened");
        };
        this.chatChannel.onclose = () => {
            console.log("Chat channel closed");
        };
        this.chatChannel.onmessage = (evt) => onData(evt.data);
        
        
        this.fileChannel = this.peerConnection.createDataChannel("file", dataChannelOptions);
        this.fileChannel.binaryType = "arraybuffer";
        this.fileChannel.onopen =  () => {
            console.log("File Channel open");
        };
        this.fileChannel.onclose = () => {
            console.log("File channel closed");
        };

        let receivedBuffer: any[] = [];
        let totalBytesFileBuffer = 0;
        let totalBytesArrayBuffers = 0;
        let nameFile = "";
        this.fileChannel.onmessage = (event) => {
            const {data} = event;

            try{
                if(data.byteLength){
                    receivedBuffer.push(data);
                    totalBytesArrayBuffers += data.byteLength;
                    //calculate progress bar
                    let percentage = (totalBytesArrayBuffers*100)/totalBytesFileBuffer;

                    console.log("File download: ", percentage.toPrecision(3), "%");
                }else if(data.includes(LAST_DATA_OF_FILE)){

                    getCompleteFile(receivedBuffer, totalBytesArrayBuffers, nameFile);
                    receivedBuffer = [];
                    totalBytesArrayBuffers = 0;
                    totalBytesFileBuffer = 0;
                }else{
                    const initMessage = JSON.parse(data);
                    totalBytesFileBuffer = initMessage.totalByte || 0;
                    nameFile = initMessage.fileName;
                }
            }catch(error){
                receivedBuffer = [];
                totalBytesFileBuffer = 0;
                totalBytesArrayBuffers = 0;
            }
        };
        
        this.sendOffer();

    }

    async create_as_receiver(offer: string, onData: (data: String) => void){
        console.log("New offer received", offer);
        let offerSdp: RTCSessionDescriptionInit = JSON.parse(offer);
        try {
            await this.peerConnection.setRemoteDescription(offerSdp);
            try {
                let answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                this.websocket.sendAnswer(this, JSON.stringify(answer));
                this.startICEExchange();
            } catch (error) {
                console.log("Error in createAnswer: " + error);
            }
        } catch (error) {
            console.log("Error in setRemoteDescription: " + error);
        }

        // accept data channel
      this.peerConnection.ondatachannel = (ev) => {
        if (ev.channel.label === "chat"){
            this.chatChannel = ev.channel;

            this.chatChannel.onopen = () => {
                console.log("Chat channel opened");
            };
            this.chatChannel.onclose = () => {
                console.log("Chat channel closed");
            };
            this.chatChannel.onmessage = (evt) => onData(evt.data);
        } else if (ev.channel.label === "file"){
            this.fileChannel = ev.channel;
            this.fileChannel.onopen = () => {
                console.log("File channel opened");
            };
            this.fileChannel.onclose = () => {
                console.log("File channel closed");
            };
    
            let receivedBuffer: any[] = [];
            let totalBytesFileBuffer = 0;
            let totalBytesArrayBuffers = 0;
            let nameFile = "";
            this.fileChannel.onmessage = (event) => {
                const {data} = event;

                try{
                    if(data.byteLength){
                        receivedBuffer.push(data);
                        totalBytesArrayBuffers += data.byteLength;
                        //calculate progress bar
                        let percentage = (totalBytesArrayBuffers*100)/totalBytesFileBuffer;

                        console.log("File download: ", percentage.toPrecision(3), "%");
                    }else if(data.includes(LAST_DATA_OF_FILE)){

                        getCompleteFile(receivedBuffer, totalBytesArrayBuffers, nameFile);
                        receivedBuffer = [];
                        totalBytesArrayBuffers = 0;
                        totalBytesFileBuffer = 0;
                    }else{
                        const initMessage = JSON.parse(data);
                        totalBytesFileBuffer = initMessage.totalByte || 0;
                        nameFile = initMessage.fileName;
                    }
                }catch(error){
                    receivedBuffer = [];
                    totalBytesFileBuffer = 0;
                    totalBytesArrayBuffers = 0;
                }
            };
        }
      };
    }

    sendMessage(msg: String, type: ChatMessageType){
        this.chatChannel?.send(JSON.stringify({
            sender: this.myUserName,
            data: msg,
            type: type
        } as ChatMessage));
    }

    async sendFile(file: File){
    
        const file_buffer = await file.arrayBuffer();
        try {
            this.sendFileData(JSON.stringify({
                totalByte: file_buffer.byteLength,
                dataSize: MAXIMUM_SIZE_DATA_TO_SEND,
                fileName: file.name,
            })
            );
            

            for(let index = 0; index <file_buffer!.byteLength; index += MAXIMUM_SIZE_DATA_TO_SEND){
                this.sendFileData(file_buffer?.slice(index, index+MAXIMUM_SIZE_DATA_TO_SEND));
            }
            this.sendFileData(LAST_DATA_OF_FILE);
        }catch(error){
            console.error("Errror sending big file", error);
        };
    }

    sendFileData(fileData: any){
        this.fileQueue.push(fileData);
        if(this.paused){
            return;
        }

        this.shiftQueue();
    }

    shiftQueue = () => {
        this.paused = false;
        let message = this.fileQueue.shift();
        
        while(message){
            if(this.fileChannel?.bufferedAmount && (this.fileChannel.bufferedAmount > BUFFER_THRESHOLD)){
                this.paused = true;
                this.fileQueue.unshift(message);

                const listener = () =>{
                    this.fileChannel?.removeEventListener("bufferedamountlow", listener);
                    this.shiftQueue();
                };

                this.fileChannel.addEventListener("bufferedamountlow", listener);
                return;
            }

            try{
                this.fileChannel?.send(message);
                message = this.fileQueue.shift();
            }catch (error){
                throw new Error(`Somehing went not okay: ${error}`);
            }
        }
    };



    async processAnswer(answer: string){
        console.log("PROCESSING ANSWER", answer);
        let answerSdp: RTCSessionDescriptionInit = JSON.parse(answer);
    
        try {
            await this.peerConnection.setRemoteDescription(answerSdp);
            console.log("Answer processed successfully");
            this.startICEExchange();
        } catch (error) {
            console.log("Error in setRemoteDescription: " + error);
        }
    
    };


    startICEExchange(){
        this.state = PeerConnectionState.ExchangingICE;

        this.ICEBuffer.forEach((ice)=>{
            this.processICE(ice);
        });
    }


    async processICE( ice: String){
        console.log("Processing ice:", ice);
        let candidates = ice.split("\n");
    
        for (let cand of candidates) {
            if (cand.trim().length === 0) continue;
    
            let c: RTCIceCandidate = JSON.parse(cand);
            console.log(c);
            await this.peerConnection.addIceCandidate(c);
        }
    
    };

    async sendOffer(){
        console.log("Websocket: ", this.websocket);
        // send a connection offer to the other user
        try {
            let offer = await this.peerConnection.createOffer();
            this.peerConnection.setLocalDescription(offer)
            .then(() => {
                // send sdp offer to other via websocket
                this.websocket.sendOffer(this, JSON.stringify(offer));
                console.log("Connection offer creation success");
            })
            .catch((error) => {
                console.log("Error in setLocalDescription: " + error);
            });
        } catch (error) {
            console.log("Error in createOffer: " + error);
            return;
        }
    }

    myUserName: String;
    otherUserName: String;
    chatChannel: RTCDataChannel| null;
    fileChannel: RTCDataChannel | null;
    peerConnection: RTCPeerConnection;
    state: PeerConnectionState;
    ICEBuffer: string[];
    websocket: SignalingWebsocket;
    paused: boolean;
    fileQueue: any[];
}
