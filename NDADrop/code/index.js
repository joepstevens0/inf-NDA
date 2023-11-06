const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const net = require('net');
const http = require("http");
const https = require("https");
const fs = require("fs");
const app = express();
const port = 9004;

let server = net.createServer(socket => {
    socket.once('data', buffer => {
        // Pause the socket
        socket.pause();

        // Determine if this is an HTTP(s) request
        let byte = buffer[0];

        let protocol;
        if (byte === 22) {
            protocol = 'https';
        } else if (32 < byte && byte < 127) {
            protocol = 'http';
        }

        let proxy = server[protocol];
        if (proxy) {
            // Push the buffer back onto the front of the data stream
            socket.unshift(buffer);

            // Emit the socket to the HTTP(s) server
            proxy.emit('connection', socket);
        }
        
        // As of NodeJS 10.x the socket must be 
        // resumed asynchronously or the socket
        // connection hangs, potentially crashing
        // the process. Prior to NodeJS 10.x
        // the socket may be resumed synchronously.
        process.nextTick(() => socket.resume()); 
    });
});

server.http = http.createServer(app);
server.https = https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  }, app);


const ws = new WebSocket.Server({ server: server.http });
const wss = new WebSocket.Server({ server: server.https });



// const UserThing = {
//   id: Number,
//   userName: String,
//   socket: WebSocket.WebSocket
// }

//beter manier id securtity

let id_counter = 0;
let users = [];

function findUserIndex(id) {
  for (let i = 0; i < users.length; ++i) {
    if (users[i].id === id) {
      return i;
    }
  }
  return -1;
}

function findUserNameIndex(name) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].name === name) {
      return i;
    }
  }
  return -1;
}


function heartbeat() {
  this.isAlive = true;
}

const interval_wss = setInterval(function ping() {
  wss.clients.forEach(function each(wssUser) {
    if (wssUser.isAlive === false) return wssUser.terminate();

    wssUser.isAlive = false;
    wssUser.ping();
  });
}, 30000);

wss.on('close', ()=>{
  clearInterval(interval_wss);
});

const interval_ws = setInterval(function ping() {
  ws.clients.forEach(function each(wsUser) {
    if (wsUser.isAlive === false) return wsUser.terminate();

    wsUser.isAlive = false;
    wsUser.ping();
  });
}, 30000);

ws.on('close', ()=>{
  clearInterval(interval_ws);
});

const on_websocket_connection = (socket) => {
  console.log("new connection");

  socket.isAlive = true;
  socket.on('pong', heartbeat);

  let id = id_counter++;
  users.push({ id: id, name: undefined, socket: socket });
  // send users to new user
  users.forEach((user) => {
    if (user.name !== undefined) {
      socket.send(JSON.stringify({type: "new_user", sender: user.name, receiver: user.name, data: "true"}));
    }
  });

  socket.on("message", (msgData) => {
    let message = JSON.parse(msgData);
    console.log("New message:", String(msgData));

    if (message.type === "set_username") {
      const userIndex = findUserIndex(id);

      if (id === -1) {
        console.log("User not found for id:", id);
        return;
      }

      users[userIndex].name = message.data;

      //send usernames
      users.forEach((other_user) => {
        other_user.socket.send(
          JSON.stringify({type: "new_user", sender: users[userIndex].name, receiver: other_user.name, data: "false"})
        );
      });
    } else if (message.type === "offer_sdp") {
      let userIndex = findUserNameIndex(message.receiver);
      let receiver = users[userIndex].socket;
      receiver.send(JSON.stringify(message));
    } else if (message.type === "answer_sdp") {
      let userIndex = findUserNameIndex(message.receiver);
      let receiver = users[userIndex].socket;

      receiver.send(JSON.stringify(message));
    } else if (message.type === "ice") {
      let userIndex = findUserNameIndex(message.receiver);
      let receiver = users[userIndex].socket;

      receiver.send(JSON.stringify(message));
    }
  });
  socket.on("close", function(){
      console.log("Onclose:", id);
    
        let userIndex = findUserIndex(id);
        if (userIndex >= 0){
          let user_name = users[userIndex].name;
          if (user_name !== undefined){
            console.log("remove_user:", user_name);
            users.forEach((other_user) => {
              other_user.socket.send(
                JSON.stringify({type: "remove_user", sender: user_name, receiver: other_user.name, data: ""})
              );
            });
          }
          users.splice(userIndex, 1);
      }
  });
};

ws.on("connection", on_websocket_connection);
wss.on("connection", on_websocket_connection);

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// });

server.listen(process.env.PORT || 9004, () => {
  console.log(`App listening on port ${port}`);
});
app.use(express.static(path.join(__dirname, "frontend", "build")));
