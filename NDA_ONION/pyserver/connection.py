from typing import List
from constants import ip_to_id
from personid import PersonID
from simulationmessage import SimulationMessage, SimulationMessageType


class Connection:
    logs: List[SimulationMessage]
    write_buffer: List[bytes]

    def __init__(self):
        self.logs = []
        self.write_buffer = []

    def need_writing(self):
        return len(self.write_buffer) > 0

    def get_writebuffer(self):
        return self.write_buffer
    
    def clear_writebuffer(self):
        self.write_buffer = []


    def get_id(self) -> PersonID or None:
        return self.id

    def send_message(self, msg: SimulationMessage):
        self.write_buffer.append(msg.encode_msg())

    def on_recv(self, data: bytes):
        message = SimulationMessage.decode_msg(data.decode())

        if message.get_type() == SimulationMessageType.INIT_MESSAGE:
            print("Init for client:", message.get_data())
            id = message.get_data().split("\n")[0]
            self.id = PersonID(id)
        if message.get_type() == SimulationMessageType.RECONNECT:
            print("Reconnect for client:", message.get_data())
            id = message.get_data().split("\n")[0]
            self.id = PersonID(id)
            return # don't add to logs
        if message.get_type() == SimulationMessageType.LOG_MESSAGE:
            print("Log message: ", message.get_data())
        
        self.logs.append(message)

    def take_logs(self) -> List[SimulationMessage]:
        l = self.logs
        self.logs = []
        return l
    
    def get_logs(self):
        return self.logs
    
    def empty_logs(self):
        self.logs = []
