import { useState } from "react";

import { TextArea, Wrapper, Button, MessageWrapper, Message } from "./chatbox.styles";

export type Message= {
  userSender: String,
  msg: String,

}

export default function ChatBox(messages: Message[], onSendMessage: (msg: String)=>void) {
  const [chat_input, set_chat_input] = useState("");

  // if (chat_channel === undefined) {
  //   return <div>Loading chat...</div>;
  // }

  // chat_channel.onmessage = (event) => {
  //   console.log("Message received:", event);
  //   set_chat_messages((m) => [...m, event.data]);
  // };

  function send_message() {
    onSendMessage(chat_input);
  }
  let message_elements: React.ReactElement[] = [];
  messages.forEach((m, index) => {
    message_elements.push(<Message><p key={index} className="bold">{m.userSender}:</p><p className="send"> {m.msg}</p> </Message>);
  });

  return (
    <Wrapper>
      <h2>Global Chat</h2>
      <hr></hr>
      <MessageWrapper>
        {message_elements}
      </MessageWrapper>
      
      <TextArea
        value={chat_input}
        onChange={(ev) => set_chat_input(ev.target.value)}
      ></TextArea>
      <Button onClick={send_message}>Send</Button>
    </Wrapper>
  );
}
