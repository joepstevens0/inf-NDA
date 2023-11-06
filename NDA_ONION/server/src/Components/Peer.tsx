import { CopieDiv, FlexMultiVal, MessageDiv, NeighbourSelectDiv, SendMsgDiv, StatusDiv, Wrapper, Flexfordiv } from "./Peer.styled";
import { ReactElement, useState } from "react";
import TextField from "@material-ui/core/TextField"
import { Button, Grid, InputLabel, MenuItem, Select } from "@material-ui/core";



export type Peer = {
    id: String,
    neighbours: String[],
    messages: MessageType [],
    position: Number,
    status: Boolean,
    copies: Map<String, Copies>
}

export type MessageType = {
    type: String,
    msg: String,
    sender: String,
    receiver: String,
}

export type Copies = {
    sender: String,
    receiver: String,
    id: String,
    total: Number
}


type Props = {
    peer: Peer;
    peerList: Peer[];
    sendMsg: (senderId: String, receiverI: String, msg: String) => void;
    changeStat: (peerId: String, status: Boolean) => void;
    changePos: (peerId: String, position: Number) => void;
    changeNeighbours: (peerId: String, neighbours: String[]) => void;
}


//Going to be component for options per peer
const PeerComponent: React.FC<Props> = ({peer, peerList, sendMsg, changeStat, changePos, changeNeighbours}) =>{
    const [msg, setMsg] = useState("");
    const [receiverMsg, setReceiverMsg] = useState("");

    const [position, setPosition] = useState(peer.position);
    const [status, setStatus] = useState(peer.status);

    const [neighbours, setNeighbours] = useState<Array<String>>(peer.neighbours);
    const [peerListNeigbours, setPeerListNeigbours] = useState(peerList);

    const handleCheck = (event: any) =>{
        let updatedList = [...neighbours];
        
        if(event.target.checked){
            updatedList = [...neighbours, event.target.value];
        }else{
            updatedList.splice(neighbours.indexOf(event.target.value), 1);
        }
        
        setNeighbours(updatedList);
    }

    const check = ()=>{
        console.log("neigbour list:"+neighbours);
        console.log("peerid"+peer.id);
        console.log("peer neighour"+peer.neighbours);
        const temp = peerListNeigbours;
        setPeerListNeigbours(temp);
        
    }

    // create copies elements
    let copies_elements: ReactElement[] = [];
    peer.copies.forEach((copy: Copies, key: String)=>{
        copies_elements.push(
            <div key={String(copy.id)}>
                <Flexfordiv>
                    <p className="left">id:</p><p className="right"> {copy.id}</p>
                </Flexfordiv>
                <FlexMultiVal>
                <p className="keyWords">Sender: </p>
                        <p className="value"> {copy.sender} </p>
                    <p className="keyWords">receiver: </p>
                        <p className="value">{copy.receiver}</p> 
                    <p className="keyWords">total: </p>
                        <p className="value">{copy.total.toString()}</p>
                </FlexMultiVal>
                
                <hr />
            </div>);
        }
    );

    return(
        <Wrapper>
                <h3>Name of Peer: {peer.id}</h3>

                <h4>Select Neighbours:</h4>
                <NeighbourSelectDiv>
                    {peerListNeigbours.map((neighbour, index) =>(
                        (neighbour.id) === peer.id? null: 
                        <div key={neighbour.id+""+peer.id}>
                                <input value={neighbour.id+""} type="checkbox" onChange={handleCheck}  checked={neighbours.includes(neighbour.id)}/>
                            <span>{neighbour.id}</span>
                        </div>
                    ))}

                    <Button onClick={() => changeNeighbours(peer.id, neighbours)}>Change Neigbours</Button>
                </NeighbourSelectDiv>

                <h4>Messages:</h4>
                <MessageDiv>
                    {peer.messages.map((message, index) =>(
                        <div key={message.sender+""+index}>
                            <Flexfordiv>
                                <p className="left">Type:</p><p className="right"> {message.type}</p>
                            </Flexfordiv>
                            <FlexMultiVal>
                                <p className="keyWords">Sender: </p>
                                    <p className="value">{message.sender}</p>
                                <p className="keyWords">Receiver: </p>
                                    <p className="value">{message.receiver}</p>
                            </FlexMultiVal>
                            <Flexfordiv>
                                <p className="left">Data:</p>
                                    <p className="right">{message.msg}</p>
                            </Flexfordiv>
                            
                            <hr/>
                        </div>
                    ))}
                </MessageDiv>

                <h4>Copies:</h4>
                <CopieDiv>
                    {copies_elements}
                </CopieDiv>




                <h4>Send mesage to Peer:</h4>
                <SendMsgDiv>
                    <InputLabel>Message to send</InputLabel>
                    <TextField style={{width: "95%", marginBottom: 10}} id="msgInput" onChange={(e) => setMsg(e.target.value)}></TextField>
                  
                    <InputLabel>Receiver</InputLabel>
                    <Select style={{width: 250}} id="receiverSelect" onChange={(e) => setReceiverMsg(e.target.value+"")} defaultValue={receiverMsg}>
                        {peerList.map((peer, index)=>(
                                <MenuItem key={index} value={peer.id as string}>{peer.id}</MenuItem>
                        ))}
                    </Select>
                
                    <Button onClick={() => sendMsg(peer.id, receiverMsg, msg)}>Send!</Button>
       
                </SendMsgDiv>

                <h4>Change Status:</h4>
                <StatusDiv>
                    <Button style={{textAlign: "center"}} onClick={() => {changeStat(peer.id, !status); setStatus(!status);}}>{status.toString()}</Button>
                </StatusDiv>

        </Wrapper>
    );
};

export default PeerComponent;
