import { useState } from "react";
import { Logtype, Wrapper } from "./LogComponent.styled";

const listMsgTypes = ["INIT_MESSAGE", "_1", "_2", "RECV", "LOG_MESSAGE", "SEND",
                    "CHANGE_STATUS", "NEW_NEIGHBORS","_8","_9", "_10", "LOG_MESSAGE_ONION_SEND", 
                    "LOG_MESSAGE_ONION_RECV", "LOG_MESSAGE_ONION_RECV_ACK", 
                    "LOG_MESSAGE_HOP", "LOG_MESSAGE_ENCRYPTED", "COPY_UPDATE", "LOG_MESSAGE_SWB_RECV",
                    "LOG_MESSAGE_SWB_RECV_ACK"];


type Props = {
    logData: String[];
}

const LogComponent:React.FC<Props> = ({logData}) => {
    
    return(
        <Wrapper>
            <Logtype>Type: {listMsgTypes[Number(logData[0])]}</Logtype>
            <p>Data: {logData.slice(1).map(el => " "+el )}</p>
        </Wrapper>
    );
}

export default LogComponent;

