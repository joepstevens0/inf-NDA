import ReactDOM from "react-dom/client";
import { useState } from "react";
import ChatBox, { Message } from "./chatbox";
// import { sendICE, sendOffer } from "./helper/wsSend";
// import { WebSocketOnRecv } from "./helper/wsRecv";
import UserListEl, { UserList } from "./userlist";
import React from "react";
import PeerConnection, {
  ChatMessageType,
  ChatMessage,
} from "./helper/peerConnection";
import SignalingWebsocket from "./helper/websocket";
import { Button, StartWrapper, Wrapper } from "./index.styles";

export const BYNARY_TYPE_CHANNEL = "arraybuffer";
export const MAXIMUM_SIZE_DATA_TO_SEND = 65535;
export const BUFFER_THRESHOLD = 65535;
export const LAST_DATA_OF_FILE = "LDOF7";

export type FileTransferMessage = {
  action: String;
  name: String;
  id: String;
};


export default function App() {
  // const [peer_connections, set_peer_connections] = useState(
  //   new Map<String, PeerConnection>()
  // );

  const [name_input, set_name_input] = useState("");
  const [name_is_chosen, set_name_is_chosen] = useState(false);

  const [userlist, set_userlist] = useState(new UserList());
  const [ws, set_ws] = useState(undefined as undefined | SignalingWebsocket);

  const [messages, set_messages] = useState([] as Message[]);

  // const [nieuwe_fileOffers, nieuwe_setFileOffers] = useState([] as FileOffer[]);
  //const [outgoingOffers, setOutgoingOffers] = useState([] as [ArrayBuffer, String][]);
  //const [outgoingOffers, setOutgoingOffers] = useState([] as {name: String, array: ArrayBuffer}[]);
  // const [outgoingOffers, setOutgoingOffers] = useState([] as File[]);

  /**
   * On data function for when a peerconnection receives data
   */
  const onData = async (data: String, sender: String) => {
    let msg: ChatMessage = JSON.parse(data + "");

    if (msg.type === ChatMessageType.Message) {
      set_messages((messages) => [
        ...messages,
        {
          userSender: sender,
          msg: msg.data,
        },
      ]);
    } else if (msg.type === ChatMessageType.FileTransfer) {
      let filetransfer: FileTransferMessage = JSON.parse(msg.data + "");
      await userlist.handleFileTransferMessage(filetransfer, sender);
      set_userlist(userlist);
      forceUpdate();
      // set_userlist((userlist)=>{
      //   userlist.handleFileTransferMessage(filetransfer, sender);
      //   return userlist;
      // });
    }
  };

  /**
   * On offer function for when the websocket receives an offer
   */
  function onOffer(
    offer: String,
    sender: String,
    signaling_ws: SignalingWebsocket
  ) {
    let new_connection = new PeerConnection(sender, name_input, signaling_ws); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    new_connection.create_as_receiver("" + offer, (data) =>
      onData(data, sender)
    );
    set_userlist((userlist) => {
      userlist.setPeerConnection(sender, new_connection);
      return userlist;
    });
    forceUpdate();
  }

  /**
   * On anwser function for when the websocket receives an answer
   */
  function onAnswer(answer: String, sender: String) {
    console.log("ONANSWER:", sender);
    let connection = userlist.getPeerConnection(sender);
    if (connection !== null) {
      connection.processAnswer("" + answer);
    }
  }

  /**
   * On ice function for when the websocket receives ICE data from another user
   */
  function onIce(ice: String, sender: String) {
    let connection = userlist.getPeerConnection(sender);
    if (connection !== null) {
      connection.processICE("" + ice);
    }
  }

  async function start() {
    set_name_is_chosen(true);

    // create websocket
    let ws = new SignalingWebsocket(
      addUserName,
      removeUserName,
      onOffer,
      onAnswer,
      onIce
    );

    // send username
    ws.sendUserName(name_input);
    set_ws(ws);
  }
  const [, updateState] = React.useState({});
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const addUserName = (
    name: String,
    signaling_ws: SignalingWebsocket,
    can_send_offer: boolean
  ) => {
    if(name === name_input){
      return;
    }
    console.log("Add username", name);

    set_userlist((userlist) => {
      userlist.addUser(name);
      return userlist;
    });
    forceUpdate();

    if (can_send_offer) {
      let new_connection = new PeerConnection(name, name_input, signaling_ws);
      new_connection.create_as_sender((data) => onData(data, name));
      set_userlist((userlist) => {
        userlist.setPeerConnection(name,new_connection);
        return userlist;
      });
    }
  };

  const removeUserName = (name: String) => {
    console.log("Removing user:", name);
    userlist.removeUserName(name);
    set_userlist(userlist);
    forceUpdate();
  };

  /**
   * Called when chat message needs to be send
   * @param msg content of the message
   */
  function onSendMessage(msg: String) {
    userlist.sendChatMessage(msg);
    set_messages((messages) => [
      ...messages,
      {
        userSender: name_input,
        msg: msg,
      },
    ]);
  }

  return (
    <Wrapper>
      <StartWrapper hidden={name_is_chosen}>
        <h1>Welcome to ChatSend</h1>
        <p>Please fill in a username. This will be visible for everybody.</p>
        <input onChange={(evt) => set_name_input(evt.target.value)} placeholder="Username"></input>
        <Button onClick={start} >Choose name</Button>
      </StartWrapper>

      <div hidden={!name_is_chosen}>
          <h2>Name is: {name_input}</h2>

          {ChatBox(messages, onSendMessage)}
          <UserListEl users={userlist} />
      </div>
      
    </Wrapper>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
