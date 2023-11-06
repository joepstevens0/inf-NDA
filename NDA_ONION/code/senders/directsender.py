
import time
from typing import List, Tuple
from constants import RESEND_DATA_MESSAGE_TIME, MESSAGE_SEND_DELAY
from datasocket import DataSocket
from datamessage import DataMessage
from personid import PersonID
from neighbor import NeighborList

class DirectSender:
    pending_data_messages: List[Tuple[str, PersonID, DataMessage, float]]   # msg_id, receiver, msg, last_send_time

    def __init__(self):
        # list of messages without ack
        self.pending_data_messages = []
    
    def send_message(self, msg_id: str, receiver: PersonID, msg: DataMessage):
        self.pending_data_messages.append((msg_id, receiver, msg, time.time() - RESEND_DATA_MESSAGE_TIME + MESSAGE_SEND_DELAY))

    def update(self, data_socket: DataSocket, neighbor_list: NeighborList):
        self.resend_pending_messages(data_socket)

    def on_ack(self, ack_msg: DataMessage):
        # remove from pending messages
        for value in self.pending_data_messages:
            (msg_id, receiver, message, last_send_time) = value
            if msg_id == ack_msg.get_data():
                self.pending_data_messages.remove(value)

    def resend_pending_messages(self, data_socket: DataSocket):
        current_time = time.time()
        for i in range(0, len(self.pending_data_messages)):
            (msg_id, receiver, message, last_send_time) = self.pending_data_messages[i]
            if current_time - last_send_time > RESEND_DATA_MESSAGE_TIME:
                data_socket.send_message(receiver, message)
                self.pending_data_messages[i] = (msg_id, receiver, message, current_time)
