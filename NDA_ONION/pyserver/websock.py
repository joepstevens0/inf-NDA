from typing import List
from websocket_server import WebsocketServer

from simulationmessage import SimulationMessage

class WebSock:

    recv_buffer: List[SimulationMessage]

    def __init__(self):
        self.recv_buffer = []

        self.server = WebsocketServer(host="127.0.0.1", port=8765)
        self.server.set_fn_client_left(self.left_client)
        self.server.set_fn_message_received(self.get_message)
        self.server.set_fn_new_client(self.new_connection)

        self.server.run_forever(True)
        print("Started websocket server")

    def new_connection(self, client, server):
        print("new connection")
        print(server.clients)


    def get_message(self, client, server, message):
        print("Websock message:\n|||||||||||||||||\n", message, "\n|||||||||||||||||||||")
        msg = SimulationMessage.decode_msg(message)
        self.recv_buffer.append(msg)


    def take_messages(self):
        msgs = self.recv_buffer
        self.recv_buffer = []
        return msgs
        

    def left_client(self, client, server):
        print("Websock client left")

    def send_message_websocket_server(self, message: SimulationMessage):
        #print("Sending sim message to websock:", message.encode_msg())
        result = message.make_json()
        self.server.send_message_to_all(result)


