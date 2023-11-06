import React from "react";
import { useState } from "react";
import FileTransfer, { FileOffer } from "./filetransfer";
import {FileTransferMessage} from "./index"
import PeerConnection, { ChatMessageType } from "./helper/peerConnection";

import {Wrapper, UserWrapper, HeaderWrapper, OutGoingWrapper} from "./userlist.styles";

type User = {
    name: String,
    peerConnection: PeerConnection | null,
    fileOffers: FileOffer[],
    outgoingOffers: OutgoingFileOffer[],
};

enum FileOfferState {
    Pending = "Pending",
    Accepted = "Accepted",
    Rejected = "Rejected"
};

type OutgoingFileOffer = {
    file: File,
    state: FileOfferState
}

export class UserList{
    constructor(){
        this.users = [];
    }

    addUser(user_name: String){
        this.users.push({name: user_name, peerConnection: null, fileOffers: [], outgoingOffers: []});
    }

    setPeerConnection(user_name: String,peerConnection: PeerConnection){
        for (let i = 0; i < this.users.length;++i){
            if (this.users[i].name === user_name){
                this.users[i].peerConnection = peerConnection;
                return;
            }
        }
    }

    getPeerConnection(user_name: String): PeerConnection | null{
        for (let i = 0; i < this.users.length;++i){
            if (this.users[i].name === user_name){
                return this.users[i].peerConnection;
            }
        }
        return null;
    }

    totalUsers(): Number{
        return this.users.length;
    }
    getUserName(id: number): String{
        return this.users[id].name;
    }
    getAllUserNames(): String[]{
        let usernames:String[] = [];
        this.users.forEach((user)=>{
            usernames.push(user.name);
        })
        return usernames;
    }

    getAllUsers(): User[] {
        return this.users;
    }

    getUser(userName: String): User|undefined{
        for(let i=0; i < this.users.length; i++){
            if(this.users[i].name === userName){
                return this.users[i];
            }
        }
        return undefined
    }

    removeUserName(user_name: String){
        let x=this.users.findIndex(user => user_name ===user.name);
        this.users[x].peerConnection?.close();
        this.users.splice(x, 1);
        console.log("filter users",user_name,this.users);
        
    }

    /**
     * Send chat message from this user to all other user
     * @param msg 
     */
    sendChatMessage(msg: String){
        console.log("Sending messages to peerconnections: ", msg);
        this.users.forEach((user) => {
            user.peerConnection?.sendMessage(msg, ChatMessageType.Message);
        });
    }

    /**
     * save a file offer from another user
     */
    addFileTransferOffer(user_name: String,filetransfer: FileOffer ){
        for (let i = 0; i < this.users.length;++i){
            if (this.users[i].name === user_name){
                this.users[i].fileOffers.push(filetransfer);
                break;
            }
        }
    }

    /**
     * Remove the fileoffer from a user
     */
    removeFileTransferOffer(user_name: String, id: String){
        for (let i = 0; i < this.users.length;++i){
            if (this.users[i].name === user_name){
                if (this.users[i].fileOffers.length !== 0) {
                    let index = this.users[i].fileOffers.findIndex((offer) => id === offer.id);
                    console.log("remove offer index", index);

                    this.users[i].fileOffers.splice(index, 1);
                } else {
                    console.error("Trying to remove an offer not in the offerlist");
                }
                return;
            }
        }
    }

    handleFileTransferMessage = async (
        filetransfer: FileTransferMessage,
        sender: String
      ) => {
        console.log("File transfer message:", filetransfer);

        let user = this.getUser(sender);
        if (user === undefined){
            return;
        }
        
        if (filetransfer.action === "offer") {
          const offer: FileOffer = {
            name: filetransfer.name,
            sender: sender,
            onAccept: () => {
                this.getPeerConnection(sender)?.sendMessage(
                JSON.stringify({
                  action: "accept",
                  name: filetransfer.name,
                }),
                ChatMessageType.FileTransfer
              );
              this.removeFileTransferOffer(sender,filetransfer.id);
            },
            onReject: () => {
                this.getPeerConnection(sender)?.sendMessage(
                JSON.stringify({
                  action: "reject",
                  name: filetransfer.name,
                }),
                ChatMessageType.FileTransfer
              );
              this.removeFileTransferOffer(sender, filetransfer.id);
            },
            id: filetransfer.id,
          };
    
          // const temp = fileOffers;
          // temp.push(offer);
          // fileOffers.push(offer);
          // setFileOffers(fileOffers);
          this.addFileTransferOffer(sender, offer);
          //forceUpdate();
          // nieuwe_setFileOffers(l => [...l,
          //   offer
          // ]);
        } else if (filetransfer.action === "accept") {
          for (let i = 0; i < user.outgoingOffers.length; ++i) {
            if (user.outgoingOffers[i].file.name === filetransfer.name) {
              await this.getPeerConnection(sender)?.sendFile(user.outgoingOffers[i].file);
              
              user.outgoingOffers[i].state = FileOfferState.Accepted;
              return;
            }
          }
        } else if (filetransfer.action === "reject") {
          for (let i = 0; i < user.outgoingOffers.length; ++i) {
            if (user.outgoingOffers[i].file.name === filetransfer.name) {
              user.outgoingOffers[i].state = FileOfferState.Rejected;
              return;
            }
          }
          alert("File rejected");
        }
      };

    addUserOutgoingOffer(file: File, user_name: String){
        for (let i = 0; i < this.users.length;++i){
            if (this.users[i].name === user_name){
                this.users[i].outgoingOffers.push({file: file, state: FileOfferState.Pending})
                return;
            }
        }
    }

    deleteUserOutgoingOffer(user_name: String, file_name: String){
        for(let i=0; i<this.users.length; i++){
            if(this.users[i].name === user_name){
                let index=this.users[i].outgoingOffers.findIndex(outOffer => outOffer.file.name === file_name);
                if(index !== -1){
                    this.users[i].outgoingOffers.splice(index, 1);

                }
            }
        }
    }


    users: User[];
    
};


export default function UserListEl(props: {users: UserList}){
    const [, updateState] = React.useState({});
    const forceUpdate = React.useCallback(() => updateState({}), []);

    const [selectedFilePerUser, setSelectedFilePerUser] = useState(new Map<String,File|undefined>());

    // const [selectedUserFile, setSelectedUserFile] = useState()

    let user_elements: React.ReactElement[]  = [];
    props.users.getAllUserNames().forEach((user, index)=>{
        user_elements.push(<div key={index}>{user}</div>);
    });




    const changeHandler = (event:any, userName: String) =>{
        selectedFilePerUser.set(userName, event.target.files[0]);
        setSelectedFilePerUser(selectedFilePerUser);
        forceUpdate();
    };

    const handleSubmission = async (user_name: String) =>{
        console.log("Check how to get userdata", user_name, props.users);
        
        let selected_file = selectedFilePerUser.get(user_name);
        if (selected_file !== undefined){
          console.log("selecetd file handle ",selected_file);
    
          const file_name = selected_file.name;
          const file_buffer = await selected_file.arrayBuffer();
          const offer_id = Date.now() + file_name;
        
          //Needs to change to persons pc

            props.users.addUserOutgoingOffer(selected_file, user_name);
            // props.users.getUser(user_name)?.outgoingOffers.push({file:selectedFile,state:FileOfferState.Pending});
            // setOutgoingOffers(outgoingoffers => [...outgoingoffers, 
            //   {array: file_buffer,name: file_name}
            // ]);
    
            const offer: FileTransferMessage = {action: "offer", name: file_name, id: offer_id};
            props.users.getPeerConnection(user_name)?.sendMessage(JSON.stringify(offer), ChatMessageType.FileTransfer);
            console.log([file_buffer, file_name]);
    
            
          
        } 
        forceUpdate(); 
      };


      const removeOutgoingOffer = (userName:String, fileName:String) =>{
            props.users.deleteUserOutgoingOffer(userName, fileName);
            forceUpdate();
      }
    
    return ( <Wrapper>
                <HeaderWrapper>List of Online Users: </HeaderWrapper>

            {props.users.getAllUsers().map(user =>(
            <UserWrapper key={user+""}>
                <p className="userName">{user.name}</p>
                
                <input type="file" name="file" onChange={(event) => changeHandler(event, user.name)}/>
                <button data-user={user} onClick={(event) =>{handleSubmission(user.name);}}>Submit</button>
                {selectedFilePerUser.get(user.name) ? (
                        <div>
                            <p>FileName : {selectedFilePerUser.get(user.name)?.name}</p>
                        </div>
                    ): (<div></div>)}
            
            <FileTransfer fileOffer={user.fileOffers}></FileTransfer>
            
            {
                user.outgoingOffers.map((offer:OutgoingFileOffer) => (
                  <OutGoingWrapper>
                    <hr></hr>
                    <p className="bold">{offer.state}:</p><p>{offer.file.name}</p>  
                    <button onClick={()=>{
                        removeOutgoingOffer(user.name, offer.file.name);}}>
                        X
                    </button>
                  </OutGoingWrapper>  
                ))
            }
            </UserWrapper>
            ))}
        </Wrapper>)


}

