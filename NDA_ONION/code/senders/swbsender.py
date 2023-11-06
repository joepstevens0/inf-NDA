import copy
from math import ceil
import time
from typing import Callable
from simulationmessage import SimulationMessageType
from neighbor import NeighborList
from simulationmessage import SimulationMessage
from datamessage import DataMessage, DataMessageType
from datasocket import DataSocket
from senders.copies import Copies
from constants import IPADDR
from personid import PersonID
from senders.copylist import CopyList

MAX_SAVED_COPIES = 12
COPY_TIMEOUT = 10

DATA_PREFIX = "DATA:"
ACK_PREFIX = "ACK:"

class SWBSender:
    pending_copies: CopyList    # copies without ack
    message_copies: CopyList

    add_log: Callable[[SimulationMessage], None]
    on_recv: Callable[[PersonID,bytes], None]
    
    def __init__(self, on_recv: Callable[[PersonID,bytes], None], add_log: Callable[[SimulationMessage], None], reliable: bool) -> None:
        self.pending_copies = CopyList()
        self.message_copies = CopyList()

        self.on_recv = on_recv
        self.add_log = add_log

        self.reliable = reliable

    def send_msg(self, receiver: PersonID, msg_encoded: bytes):
        self.make_swb_copies(receiver, DATA_PREFIX.encode() + msg_encoded)

    def send_ack(self, receiver, msg_id: str):
        self.make_swb_copies(receiver, (ACK_PREFIX + msg_id).encode())
    
    def create_msg_id(self, sender: PersonID, receiver: PersonID) -> str:
        return str(hash(str(time.time()) + IPADDR + receiver.get_address()))

    # make the copies
    # the start of further swb
    def make_swb_copies(self, receiver: PersonID, msg_encoded: bytes):
        msg_id = self.create_msg_id(PersonID(IPADDR), receiver)   # create id for the message
        copies = Copies(MAX_SAVED_COPIES,msg_id, PersonID(IPADDR), receiver, time.time() + COPY_TIMEOUT, msg_encoded, [])

        if(self.reliable):
            self.pending_copies.add_copies(copies)
            
        self.on_copies(PersonID(IPADDR), copies)

    # send some copies to a node
    def send_copies(self, copies: Copies, data_socket: DataSocket, receiver: PersonID):
        data = str(copies.total_copies) + '\n'
        data += copies.msg_id + '\n'
        data += copies.sender.get_address() + '\n'
        data += copies.receiver.get_address() + '\n'
        data += str(copies.timeout_time) + '\n'
        data_enc = data.encode()

        data_enc += copies.msg + '\n'.encode()

        data_socket.send_message(receiver, DataMessage(DataMessageType.ENCRYPT_MSG, data_enc))

    def send_half_copies_to_neighbor(self, receiver: PersonID, copies: Copies, data_socket: DataSocket) -> Copies:

        # send half copies to receiver
        half_copies = ceil(copies.total_copies/2)
        send_copies = copy.deepcopy(copies)
        send_copies.total_copies = half_copies
        self.send_copies(send_copies, data_socket, receiver)
        copies.total_copies -= half_copies

        # add neighbor to blacklist
        copies.add_to_blacklist(receiver)

        # log copy send
        self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE, "Sended " + str(half_copies) + " copies " + IPADDR + " -> " + receiver.get_address()))

        return copies
        
    # tries to send half of copies to neighbors
    def distribute_copies(self, copies: Copies, data_socket: DataSocket, neighbor_list: NeighborList) -> Copies:
        
        # check if receiver is direct neighbor and send to him
        if neighbor_list.has_neighbor(copies.receiver):
            # only send if not in blacklist
            if not copies.is_in_blacklist(copies.receiver):
                print("-- Sending copies to direct neighbor")
                copies = self.send_half_copies_to_neighbor(copies.receiver, copies, data_socket)

        # send to other neighbors
        i = 0
        while copies.total_copies > 1 and i < len(neighbor_list.get()):
            # only send if not in blacklist
            if not copies.is_in_blacklist(neighbor_list.get()[i]):
                copies = self.send_half_copies_to_neighbor(neighbor_list.get()[i], copies, data_socket)

            i += 1
        
        return copies

    def copies_log(self):
        copies_updates = IPADDR + "\n"
        for copy in self.message_copies.get():
            copies_updates += copy.sender.get_address() + "\n" + copy.receiver.get_address() + "\n" + copy.msg_id + "\n" + str(copy.total_copies) + "|"
                
        self.add_log(SimulationMessage(SimulationMessageType.COPY_UPDATE, 
            copies_updates
        ))
    
    def remove_copies(self, copies: Copies):
        # remove from list
        self.message_copies.remove_copies(copies)

        # if we made the copy, create new copies
        if self.pending_copies.has_copies(copies):
            copies.timeout_time = time.time() + COPY_TIMEOUT
            self.message_copies.add_copies(copies)

        # log copies update
        self.copies_log()

    # add copies to the list
    def add_copies(self, copies: Copies):
        self.message_copies.add_copies(copies)

        # log copies update
        self.copies_log()

    def on_ack(self, msg_id: str):
        # remove from pending messages
        self.pending_copies.remove_by_id(msg_id)

    def on_copies(self, sender: PersonID, copies: Copies):
        
        # add sender to blacklist
        copies.add_to_blacklist(sender)

        # add self to blacklist
        copies.add_to_blacklist(PersonID(IPADDR))

        # check if copies are for this node
        if copies.receiver.get_address() == IPADDR:
            # check if already received copies for this
            if self.message_copies.has_copies(copies):
                # add copies to list
                self.add_copies(copies)
                return

            # add copies to list
            self.add_copies(copies)

            # copies are for this node
            msg_enc = copies.msg

            if msg_enc.startswith(ACK_PREFIX.encode()):
                # got an ack for message
                self.on_ack(msg_enc[len(ACK_PREFIX):].decode())


                # log ack
                self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_SWB_RECV, IPADDR + "\n" + copies.sender.get_address()  + "\n" + str(msg_enc[len(ACK_PREFIX):])))
            elif msg_enc.startswith(DATA_PREFIX.encode()):
                # got data
                self.on_recv(sender, msg_enc[len(DATA_PREFIX):])

                # log msg
                self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_SWB_RECV_ACK, IPADDR + "\n" + copies.sender.get_address()  + "\n" + str(msg_enc[len(DATA_PREFIX):])))

                if self.reliable:
                    # send ack for data
                    self.send_ack(copies.sender, copies.msg_id)
        else:
            # add copies to list
            self.add_copies(copies)


    def update(self, data_socket: DataSocket, neighbor_list: NeighborList):
    
        # remove timeouts
        timeouts = self.message_copies.remove_timeouts()

        # make new copies for this nodes timeout messages
        for copy in timeouts:
            # if we made the copy, create new copies
            if self.pending_copies.has_copies(copy):
                copy.timeout_time = time.time() + COPY_TIMEOUT
                self.message_copies.add_copies(copy)

        # log timeouts
        if len(timeouts) > 0:
            self.copies_log()

        # distibute copies
        copies = self.message_copies.get()
        for copy in copies:
            if copy.total_copies > 1 and copy.receiver.get_address() != IPADDR:
                prev_copies = copy.total_copies

                # send extra copies to neighbors
                copy = self.distribute_copies(copy, data_socket, neighbor_list)

                if copy.total_copies != prev_copies:
                    # log copies if amount changed
                    self.copies_log()

        # update copies
        self.message_copies.set(copies)

    def on_data(self, sender: PersonID, data: bytes):
        # parse message
        data_list = data.split('\n'.encode())
        total_copies = int(data_list[0])
        msg_id = data_list[1].decode()
        msg_sender = PersonID(data_list[2].decode())
        receiver = PersonID(data_list[3].decode())
        timeout_time = float(data_list[4].decode())
        data = '\n'.encode().join(data_list[5:])
        data = data[:-1]

        copies = Copies(total_copies, msg_id, msg_sender, receiver, timeout_time, data, [])
        self.on_copies(sender, copies)
