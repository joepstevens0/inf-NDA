import React, { useEffect, useState } from 'react';
import {Wrapper} from "./App.styled";
import Graph from './Components/CytoClass';
import LogComponent from './Components/logComp';
import PeerComponent, { Peer } from './Components/Peer';
import { DataNode, Edge, GraphDataType } from './utils/types';
// import { messageSplicer } from './utils/websocket';

type MessageStruct = {
  type: String,
  data: String,
  command: any,
};


type LogStruct = {
    id: string,
    data: String
}


const listMsgTypes = ["INIT_MESSAGE", "_1", "_2", "RECV", "LOG_MESSAGE", "SEND",
                    "CHANGE_STATUS", "NEW_NEIGHBORS","_8","_9", "LOG_MESSAGE_ONION_SEND_ACK", "LOG_MESSAGE_ONION_SEND", 
                    "LOG_MESSAGE_ONION_RECV", "LOG_MESSAGE_ONION_RECV_ACK", 
                    "LOG_MESSAGE_HOP", "LOG_MESSAGE_ENCRYPTED", "COPY_UPDATE", "LOG_MESSAGE_SWB_RECV",
                    "LOG_MESSAGE_SWB_RECV_ACK"];


const ws = new WebSocket("ws://localhost:8765");

function App() {

    const [Metrics, setMetrics] = useState({
        messages_send: 0,
        real_messages_send: 0,
        messages_received: 0,
        messages_timed_out: 0,
        messages_acked: 0,
    });
    
    const [peerList, setPeerList] = useState<Array<Peer>>([]);
    const [logList, setLogList] = useState<Array<Array<String>>>([]);

    const [graphData, setGraphData] = useState<GraphDataType|undefined>(undefined);

    const [, updateState] = React.useState({});
    const forceUpdate = React.useCallback(() => updateState({}), []);


    useEffect(() =>{
        setLogList(logList);
        setPeerList(peerList);
    }, [logList, peerList])

    useEffect(()=>{
        ws.onclose = () => console.log("Websocket closed");
        ws.onopen = ()=> console.log("Websocket open");
        ws.onerror = (err) => console.log("Websocket error:", err);
        ws.onmessage = (msg) => messageSplicer(msg);
        
    }, [])  


    const messageSplicer = async (message: MessageEvent<any>) => {
        const data:String = message.data;
        const messageSplited:String[] = data.split("\n");
        //console.log(messageSplited);
        
        //Change 
        if(Number(messageSplited[0]) === listMsgTypes.indexOf("INIT_MESSAGE")){
            const newPeer:Peer = {id: messageSplited[1],
                                neighbours: [],
                                messages: [],
                                position: 0,
                                status: true,
                                copies: new Map()
                            };
            let listPeer = peerList;

            listPeer.push(newPeer);
      
            setPeerList(listPeer);

        }else if(Number(messageSplited[0]) === listMsgTypes.indexOf("LOG_MESSAGE_ONION_SEND")){
            let index = peerList.findIndex((el)=> el.id ===messageSplited[1]);
            let listPeer = peerList;

            if(index !== -1){
                
                const sendIp = messageSplited[1];
                const receiveIp = messageSplited[2];
                const msg = messageSplited[3];
                let peer = listPeer[index];
                peer.messages.push({type: "Send", msg: msg, sender: sendIp, receiver: receiveIp});
                listPeer[index] = peer;

                let metrics = Metrics;
                metrics.real_messages_send += 1;
                setMetrics(metrics);
            }
            setPeerList(listPeer);

        }else if(Number(messageSplited[0])=== listMsgTypes.indexOf("LOG_MESSAGE_ONION_SEND_ACK")){
            const index = peerList.findIndex((el)=> el.id === messageSplited[1]);
            let listPeer = peerList;

            if(index !== -1){
                const sendIp = messageSplited[1];
                const receiveIp = messageSplited[2];
                const msg = messageSplited[3];
                let peer = listPeer[index];
                peer.messages.push({type: "Send ACK", msg: msg, sender: sendIp, receiver: receiveIp});
                listPeer[index] = peer;
            }

        }else if(Number(messageSplited[0]) === listMsgTypes.indexOf("LOG_MESSAGE_ONION_RECV")){
            const index = peerList.findIndex((el)=> el.id ===messageSplited[1]);
            let listPeer = peerList;

            if(index !== -1){
                const receiveIp = messageSplited[1];
                const sendIp = messageSplited[2];
                const msg = messageSplited[3];
                let peer = listPeer[index];
                peer.messages.push({type: "Recv", msg: msg, sender: sendIp, receiver: receiveIp});
                listPeer[index] = peer;

                let metrics = Metrics;
                metrics.messages_received += 1;
                setMetrics(metrics);
            }        
            setPeerList(listPeer);


        }else if(Number(messageSplited[0]) === listMsgTypes.indexOf("LOG_MESSAGE_ONION_RECV_ACK")){
            const index = peerList.findIndex((el)=> el.id ===messageSplited[1]);
            let listPeer = peerList;

            if(index !== -1){
                const sendIp = messageSplited[1];
                const receiveIp = messageSplited[2];
                const msg = messageSplited[3];
                let peer = listPeer[index];
                peer.messages.push({type: "Recv Ack", msg: msg, sender: sendIp, receiver: receiveIp});
                listPeer[index] = peer;

                let metrics = Metrics;
                metrics.messages_acked += 1;
                setMetrics(metrics);

            }
            setPeerList(listPeer);

        }else if(Number(messageSplited[0]) === listMsgTypes.indexOf("LOG_MESSAGE_HOP")){    
            const index = peerList.findIndex((el)=> el.id ===messageSplited[1]);
            let listPeer = peerList;

            if(index !== -1){
                const sendIp = messageSplited[1];
                const receiveIp = messageSplited[2];
                const msg = messageSplited[3];
                let peer = listPeer[index];
                peer.messages.push({type: "Hop", msg: msg, sender: sendIp, receiver: receiveIp});
                listPeer[index] = peer;

            }
            setPeerList(listPeer);

        }else if(Number(messageSplited[0]) === listMsgTypes.indexOf("LOG_MESSAGE_ENCRYPTED")){
            let listLog = logList;
            listLog.push(messageSplited);
            if(listLog.length > 100){
                listLog.splice(0, listLog.length-100);
            }
            setLogList(listLog);

        }else if(Number(messageSplited[0]) === listMsgTypes.indexOf("COPY_UPDATE")){
            const index = peerList.findIndex((el)=> el.id ===messageSplited[1]);
            let listPeer = peerList;

            if(index !== -1){
                // remove index
                const data = messageSplited.join("\n").substring(messageSplited[0].length + 1 + messageSplited[1].length + 1);

                const copies_data = data.split('|');
                let peer = listPeer[index];
                
                // clear copies list
                peer.copies = new Map();
                peer.copies.clear();
                
                // update copies list with new data
                copies_data.forEach(data =>{
                    if (data === "") return;
                    const splitted = data.split("\n");
                    const sendIp = splitted[0];
                    const receiveIp = splitted[1];
                    const id = splitted[2];
                    const total = Number(splitted[3]);

                    if (total <= 0){
                        peer.copies.delete(id)
                    } else {
                        peer.copies.set(id, {receiver: receiveIp, sender: sendIp, id: id, total: total})
                    }
                    });
                    
                listPeer[index] = peer;
            }
            setPeerList(listPeer);
        }else {
            let listLog = logList;

            listLog.push(messageSplited);
            if(listLog.length > 100){
                listLog.splice(0, listLog.length-100);
            }
            setLogList(listLog);
        }

        forceUpdate();
    }

    /*
    *   Message Format for command send:
    *   Type: Send\n
    *   Sender: senderId\n
    *   Reciever: receiverId\n
    *   msg: message
    */
    const sendMessagePeer = (senderId: String, receiverId:String, message: String) => {
        //let command = {Sender: senderId, receive: receiverId, msg: message}
        let msg = "5\n"+senderId+"\n"+receiverId+"\n"+message;
        ws.send(msg);
    }

    /*
    *   message format for change status (online offline)
    *   Type: Status\n
    *   Peer: peerId\n
    *   status: Bool
    */
    const changeStatusPeer = (peerId: String, status: Boolean) =>{
        const index = peerList.findIndex((el)=> el.id === peerId);
        let peer = peerList[index];
        peer.status = status;
        peerList[index]  = peer;

        setPeerList(peerList);

        //for graph
        changeNodeStatus(peerId, status);
        
        let msg = "6\n"+peerId+"\n"+status;
        ws.send(msg);
        forceUpdate();

    }


    /*
    *   message format for change position 
    *   Type: Position\n
    *   Peer: peerId\n
    *   posit: Number
    */
    const changePositionPeer = (peerId: String, position: Number) =>{
        const index = peerList.findIndex((el)=> el.id === peerId);
        let peer = peerList[index];
        peer.position = position;
        peerList[index]  = peer;
        setPeerList(peerList);

        let msg = "1\n"+peerId+"\n"+position;
        ws.send(msg);
        forceUpdate();

    }

    //
    const changeNeigbours = (peerId:String, neighbours: String[]) =>{
        let msgList:string[] = [];
        const index = peerList.findIndex((el)=> el.id === peerId);
        let updatelist = [...peerList];
        let peer = updatelist[index];

        peer.neighbours.forEach(idNeig => {
            const temp_index = updatelist.findIndex((el) => el.id === idNeig);
            let temp = updatelist[temp_index];
            const neigbour_index = temp.neighbours.findIndex((el)=> el === peerId); 
            if(neigbour_index !== -1){
                temp.neighbours.splice(neigbour_index, 1);
            }
            updatelist[temp_index] = temp;
        })
        peer.neighbours = neighbours;
        updatelist[index] = peer;

        neighbours.forEach(idNeig => {
            const temp_index = updatelist.findIndex((el) => el.id === idNeig);
            let temp = updatelist[temp_index];
            temp.neighbours.push(peerId);
            
            updatelist[temp_index] = temp;


            msgList.push("9\n"+idNeig+"\n"+temp.neighbours.map((el) => el+"\n"));
        });

        
        setPeerList(updatelist);

        //also for edges
        changeEdgesData(peerId, neighbours);

        //Doorsturen van sheit
        let msg = "9\n"+peerId+"\n"+neighbours.map((el) => el+"\n");
        ws.send(msg);
        msgList.forEach(msg =>{
            ws.send(msg);
        });


        forceUpdate();
    }


    function getLastNumbers(ipString: String):number{
        const ipParts = ipString.split(".");
        return Number(ipParts[3]);
    }

    //for graph
    function changeNodeStatus(nodeId: String, status: Boolean){
        let index = graphData!.nodes.findIndex((el) => el.data.id === nodeId);
        if(index !== -1 && graphData){
            let graph = graphData;
            if(!status){
                
                graph.nodes[index].data.label = "("+nodeId+")";
            }else{
                graph.nodes[index].data.label = nodeId.toString();
            }
            setGraphData(graph);
        }else{
            console.log("Error: changing status for graph");
            
        }
    }

    function makeNodeData(){
        let graph:GraphDataType = {nodes:[], edges:[]};

        peerList.forEach((peer, index) => {
            let type ="";
            if(!peer.status){
                type="("+peer.id+")";
            }else{
                type=peer.id+"";
            }
            const temp: DataNode = {id: peer.id+"", label: type, type: peer.status+"s"};
            graph.nodes.push({data: temp, /*position:{y: (50/(index+1)*getLastNumbers(peer.id)), x: (50*getLastNumbers(peer.id)) }*/});
            
        });
        console.log(graph);
        

        setGraphData(graph);

    }


    function changeEdgesData(peerId: String, neighbours: String[]){

        let graph = graphData;
        if(graph){
            let edges = graph!.edges;
        
            edges.forEach((element, index)=> {
                if(element.data.source === peerId){
                    edges.splice(index, 1);
                }
                if(element.data.target === peerId){
                    edges.splice(index, 1);
                }
            });
    
    
            let filtered = edges.filter(function(value, index, arr){
                return value.data.source !== peerId && value.data.target !== peerId;
            });
    
            neighbours.forEach((element, index) =>{
                const temp: Edge = {source: peerId+"", target:element+"", label:"" };
                filtered.push({data:temp});
            });
    
            graph!.edges = filtered;
            setGraphData(graph);
    
        }
       
    }

    function clearMessages(){
        let listPeer = peerList;
        for(let i = 0; i< listPeer.length; i++){
            let temp=listPeer[i];
            temp.messages = [];
            temp.copies.clear();
            listPeer[i] = temp;
        }
        setLogList([]);
        setPeerList(listPeer);
        forceUpdate();
    }

    const ALL_NODES = [
        "172.18.0.2",
        "172.18.0.3",
        "172.18.0.4",
        "172.18.0.5",
        "172.18.0.6",
        // "172.18.0.7",
        // "172.18.0.8",
        // "172.18.0.9",
        // "172.18.0.10",
        // "172.18.0.11"
    ];

    const random_node = () => {
        return ALL_NODES[Math.floor(Math.random() * ALL_NODES.length)];
    };

    const randomNeigbours = () => { 
        ALL_NODES.forEach((node: string)=>{
            let neighbors: string[] = [];

            for (let i = 0; i < Math.floor(Math.random()*10);++i){
                let neigh = Math.floor(Math.random()*10);
                while (ALL_NODES[neigh] === node){
                    neigh = Math.floor(Math.random()*10);
                }
                if (!neighbors.includes(ALL_NODES[neigh]))
                    neighbors.push(ALL_NODES[neigh]);
            }

            changeNeigbours(node, neighbors);
        });
        forceUpdate();
    }

    const randomMsg = () =>{
        for(let i = 0; i< 10; i++){
            const node_1 = random_node();
            const node_2 = random_node();
            sendMessagePeer(node_1, node_2, ("Data: " + node_1 + " -> " + node_2));

            let metrics = Metrics;
            metrics.messages_send += 1;
            setMetrics(metrics);
        }
    }

    const printMetrics = () => {
        console.log("metrics",Metrics);
    }

    const resetMetrics = () => {
        setMetrics({
            messages_send: 0,
            real_messages_send: 0,
            messages_received: 0,
            messages_timed_out: 0,
            messages_acked: 0,
        });
    }

    return (
        <Wrapper className="App">
            <button onClick={() => makeNodeData()}>Graph render</button>
            <button onClick={() => clearMessages()}>Clear all logs</button>
            <button  onClick={() => randomNeigbours()}>random neigbour</button>
            <button onClick={() => randomMsg()}>Send random</button>
            <button onClick={() => printMetrics()}>Print metrics</button>
            <button onClick={() => resetMetrics()}>Reset Metrics</button>
            <h2>Graph of the Peers:</h2>
            {graphData ===undefined ?null:<Graph graphData={graphData}></Graph>}

            <h2>List of all the Peers:</h2>
            <div className="peer">
            {peerList.map((peer, index) => (
                <div style={{float:"left"}} key={peer.id+""+index}>
                    <PeerComponent peer={peer} peerList={peerList} sendMsg={sendMessagePeer} changePos={changePositionPeer} changeStat={changeStatusPeer} changeNeighbours={changeNeigbours}></PeerComponent>
                </div>
            ))}
            </div>
            <div>
            <h2>List of rest of the logs:</h2>
            {logList.map((log, index) =>(
                <div key={index}>
                    <LogComponent logData={log}></LogComponent>
                </div>
            ))}
            </div>
        </Wrapper>
    );
}

export default App;
