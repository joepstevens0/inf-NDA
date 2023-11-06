import React from "react";

import {Wrapper} from "./filetransfer.styles"

export type FileOffer = {
    name: String, 
    sender: String, 
    onAccept: () => void, 
    onReject: ()=>void, 
    id: String
};


export default function FileTransfer(props:{fileOffer: FileOffer[]}){

    const [, updateState] = React.useState({});
    const forceUpdate = React.useCallback(() => updateState({}), []);

    return( <Wrapper>
        {props.fileOffer.map(file => (
            <div>
                <p>Fileoffer: {file.name} from</p> <p className="bold">{file.sender}</p>
            <button className="color" onClick={(ev) =>{file.onAccept();forceUpdate();}}>Accept</button>
            <button className="color" onClick={(ev)=>{file.onReject(); forceUpdate();}}>Reject</button>
        </div>
        ))}
    </Wrapper>)
}

