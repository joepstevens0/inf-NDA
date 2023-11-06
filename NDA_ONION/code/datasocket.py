import socket
import threading
import select
from typing import List, Tuple
from simulationmessage import SimulationMessage, SimulationMessageType
from personid import PersonID
from datamessage import DataMessage

from constants import IPADDR, DATA_PORT, SOCKET_BUFFER_SIZE

class DataSocket:
    send_buffer: List[Tuple[PersonID,DataMessage]]
    read_buffer: List[Tuple[PersonID,DataMessage]]

    def __init__(self):
        self.socket = socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM)
        self.socket.bind((IPADDR, DATA_PORT))
        self.send_buffer = []
        self.read_buffer = []

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.serverloop)
        self.thread.start()
        print("Data socket started")

    def stop(self):
        self.running = False
        self.thread.join()
        print("Data socket stopped")

    def send_message(self, dest: PersonID, message: DataMessage):
        self.send_buffer.append((dest, message))

    def take_messages(self) -> List[Tuple[PersonID,DataMessage]]:
        msgs = self.read_buffer
        self.read_buffer = []
        return msgs

    def serverloop(self):
        read_list = [self.socket]

        while self.running:
            readable, writable, errored = select.select(read_list, [], [], 1)


            # read from socket
            for s in readable:
                if s is self.socket:
                    message, address = self.socket.recvfrom(SOCKET_BUFFER_SIZE)
                    if message:
                        msg = DataMessage.decode_msg(message)
                        self.read_buffer.append((PersonID(address[0]),msg))

            # write messages
            for (dest, message) in self.send_buffer:
                self.socket.sendto(message.encode_msg(), (dest.get_address(), DATA_PORT))
            self.send_buffer = []
            