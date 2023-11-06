import socket
import struct
import sys
import select
import threading
from personid import PersonID
from simulationmessage import SimulationMessage, SimulationMessageType
from typing import List
from constants import DATA_PORT, SOCKET_BUFFER_SIZE, IPADDR, ip_to_id, id_to_ip
from simulation_ip import SIMSERVER_ADDR_PORT

class SimulationSocket:
    recv_buffer: List[SimulationMessage]

    def __init__(self):
        # create socket
        self.socket = socket.socket(family=socket.AF_INET, type=socket.SOCK_STREAM)
        self.socket.connect(SIMSERVER_ADDR_PORT)

        # send init message
        self.send_message(SimulationMessage(SimulationMessageType.INIT_MESSAGE, IPADDR))

        self.recv_buffer = []

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.serverloop)
        self.thread.start()
        print("Simulation socket started")

    def stop(self):
        self.running = False
        self.thread.join()
        print("Simulation socket stopped")

    def take_messages(self) -> List[SimulationMessage]:
        messages = self.recv_buffer
        self.recv_buffer = []
        return messages

    def recv_msg(self, sock: socket.SocketType) -> bytes:
        # Read message length and unpack it into an integer
        raw_msglen = self.recvall(sock, 4)
        if not raw_msglen:
            return b""
        msglen = struct.unpack('>I', raw_msglen)[0]
        # Read the message data
        return self.recvall(sock, msglen)

    def recvall(self, sock: socket.SocketType, n: int) -> bytes:
        # Helper function to recv n bytes or return empty bytes if EOF is hit
        data = bytearray()
        while len(data) < n:
            packet = sock.recv(n - len(data))
            if not packet:
                return b""
            data.extend(packet)
        return data

    def reconnect(self):
        # try reconnect
        self.socket = socket.socket(family=socket.AF_INET, type=socket.SOCK_STREAM)
        self.socket.connect(SIMSERVER_ADDR_PORT)

        # send reconnect message
        self.send_message(SimulationMessage(SimulationMessageType.RECONNECT, IPADDR))

    def serverloop(self):
        read_list = [self.socket]

        while self.running:
            try:
                readable, writable, errored = select.select(read_list, [], [], 1)

                for s in readable:
                    if s is self.socket:
                        message = self.recv_msg(self.socket)
                        if message:
                            self.handle_msg(message.decode())
                        else:
                            self.reconnect()
            except socket.error:
                # try reconnect if disconnected
                try:
                    self.reconnect()
                except:
                    pass


    def handle_msg(self, data: str):
        # parse message
        message = SimulationMessage.decode_msg(data)

        # add to buffer
        self.recv_buffer.append(message)

    def send_message(self, msg: SimulationMessage):
        try:
            # Prefix each message with a 4-byte length (network byte order)
            msg_bytes = msg.encode_msg()
            msg_bytes = struct.pack('>I', len(msg_bytes)) + msg_bytes
            self.socket.sendall(msg_bytes)
        
        except:
            print("Failed to send simulation message: " + str(sys.exc_info()[0]))