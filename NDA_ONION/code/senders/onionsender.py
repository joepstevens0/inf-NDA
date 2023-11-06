
import copy
from math import ceil
import time
from typing import Callable, List, Tuple
from senders.swbsender import SWBSender
from senders.copies import Copies
from senders.copylist import CopyList
from simulationmessage import SimulationMessage, SimulationMessageType
from constants import ALL_NODES, ONIONS_HOPS
from constants import IPADDR
from datamessage import DataMessageType
from neighbor import NeighborList
from datasocket import DataSocket
from datamessage import DataMessage
from personid import PersonID
import rsa
import random

TIMEOUT_TIME = 15

class OnionSender:
    swb_sender: SWBSender

    public_keys: List[rsa.PublicKey]
    private_key: rsa.PrivateKey

    add_log: Callable[[SimulationMessage], None]
    on_recv: Callable[[PersonID,bytes], None]

    pending_messages: List[Tuple[PersonID, bytes, str, float]]

    def __init__(self, on_recv: Callable[[PersonID,bytes], None], add_log: Callable[[SimulationMessage], None]):
        self.swb_sender = SWBSender(self.on_swb_recv, add_log, reliable=False)
        self.add_log = add_log
        self.on_recv = on_recv
        self.pending_messages = []

        # read public keys
        self.public_keys = []
        pub_keys_file = open("code/public_keys.txt", "r")
        pub_keys = pub_keys_file.read().split(',')

        for i in range(0, len(pub_keys)):
            if pub_keys[i] != "":
                self.public_keys.append(rsa.PublicKey.load_pkcs1((pub_keys[i].encode('utf8'))))
        pub_keys_file.close()

        # read my private key
        priv_keys = open("code/private_keys.txt", "r")
        self.private_key = rsa.PrivateKey.load_pkcs1(priv_keys.read().split(',')[PersonID(IPADDR).get_id()-2].encode('utf8'))
        priv_keys.close()

    def create_msg_id(self, sender: PersonID, receiver: PersonID) -> str:
        return str(hash(str(time.time()) + IPADDR + receiver.get_address()))

    #makes onion message
    # and starts further the swb algo       
    def send_msg(self, receiver: PersonID, msg: bytes):
        msg_id = self.create_msg_id(PersonID(IPADDR), receiver)    # create id for the message

        # add to pending messages
        self.pending_messages.append((receiver, msg, msg_id, time.time() + TIMEOUT_TIME))

        # send message
        self.send_swb(receiver, msg, msg_id)


    def send_swb(self, receiver: PersonID, msg: bytes, msg_id: str):
        # send message
        (onion_message, first_hop) = self.make_onion_message(receiver, msg, msg_id)
        self.swb_sender.send_msg(first_hop, onion_message)

    def send_ack(self, receiver, msg_id: str):
        ack_msg_id = self.create_msg_id(PersonID(IPADDR), receiver)    # create id for the message
        
        self.send_swb(receiver, DataMessage(DataMessageType.DATA_ACK, msg_id.encode()).encode_msg(), ack_msg_id)


    #encrypt message with a public key, also param needed for wich node
    def encrypt_msg(self, msg: bytes, nodeId: int) -> bytes:
        block_length_bytes = int(self.public_keys[nodeId-2].n.bit_length() / 8) - 11

        result = b""
        for block_index in range(0, ceil(len(msg)/block_length_bytes)):
            block = msg[block_index*block_length_bytes: (block_index + 1)*block_length_bytes]
            encrypted_block = rsa.encrypt(block, self.public_keys[nodeId-2])
            result += encrypted_block

        return result
    

    # decrpyt de msg
    def decrypt_msg(self, msg_encryped: bytes) -> 'DataMessage':
        block_length_bytes = int(self.private_key.n.bit_length() / 8)

        data_decrypt = b""
        for block_index in range(0, ceil(len(msg_encryped)/block_length_bytes)):
            encrypted_block = msg_encryped[block_index*block_length_bytes: (block_index + 1)*block_length_bytes]
            decrypted_block = rsa.decrypt(encrypted_block, self.private_key)
            data_decrypt += decrypted_block
        
        msg = DataMessage.decode_msg(data_decrypt)
        return msg
        
    # makes the message
    # return onion (message, first_hop)
    #encryption in style van onion
    def make_onion_message(self, receiver: PersonID, msg: bytes, msg_id: str) -> Tuple[bytes, PersonID]:

        # create path
        onion_path: List[PersonID] = []
        for i in range(0, ONIONS_HOPS):
            random_node = random.choice(ALL_NODES)
            onion_path.append(random_node)
        onion_path.append(receiver)

        # log path
        log_str = "Message path: " + IPADDR
        for node in onion_path:
            log_str += " -> " + node.get_address()
        self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE, log_str ))

        msg_encoded = msg
        for i in range(len(onion_path) - 1, -1, -1):
            print("Encrypting...\n")
            if i + 1 < len(onion_path):
                data_msg = DataMessage(DataMessageType.ENCRYPT_MSG, (onion_path[i + 1].get_address() + '\n').encode() + msg_encoded)
                msg_encoded = self.encrypt_msg(data_msg.encode_msg(), onion_path[i].get_id())
            else:
                data_msg = msg_encoded + ("\n" + IPADDR).encode() + ("\n" + msg_id).encode()
                msg_encoded = self.encrypt_msg(data_msg, onion_path[i].get_id())
            
        return (msg_encoded, onion_path[0])

    def update(self, data_socket: DataSocket, neighbor_list: NeighborList):
        self.swb_sender.update(data_socket, neighbor_list)

        for i in range(0,len(self.pending_messages)):
            (pending_receiver,pending_msg, pending_msg_id, timeout_time) = self.pending_messages[i]
            if timeout_time < time.time():
                timeout_time = time.time() + TIMEOUT_TIME
                self.pending_messages[i] = (pending_receiver,pending_msg, pending_msg_id, timeout_time) 

                self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_ONION_SEND, IPADDR + "\n" + pending_receiver.get_address() + "\n" + str(pending_msg)))

                self.send_swb(pending_receiver, pending_msg, pending_msg_id)

    def on_swb_recv(self, sender: PersonID, msg_encrypt: bytes):
        # decrypt message
        print("Trying to decrypt:", msg_encrypt, "\n\n\n\n")
        msg = self.decrypt_msg(msg_encrypt)
        # check if for user


        if msg.get_type() == DataMessageType.DATA_ACK:
            data_split = msg.get_data().split('\n'.encode())
            msg_id = data_split[0].decode()
            onion_sender = PersonID(data_split[-1].decode())
            self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_ONION_RECV_ACK, IPADDR + "\n" + onion_sender.get_address()  + " \n" + msg.get_data().decode()))

            # remove from pending messages
            for (pending_receiver,pending_msg, pending_msg_id, timeout_time) in self.pending_messages:
                if pending_msg_id == msg_id:
                    self.pending_messages.remove((pending_receiver,pending_msg, pending_msg_id, timeout_time))
                
        elif msg.get_type() == DataMessageType.DATA:
            data_split = msg.get_data().split('\n'.encode())
            onion_sender = PersonID(data_split[-2].decode())
            msg_id = data_split[-1].decode()
            msgdata = '\n'.encode().join(data_split[0:-2])

            # call on recv for data
            self.on_recv(onion_sender,msgdata)

            # log message received
            self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_ONION_RECV, IPADDR + "\n" + onion_sender.get_address() + " \n" + msgdata.decode()))
    
            # send ack
            self.send_ack(onion_sender, msg_id)

            # log send ack
            self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_ONION_SEND_ACK, IPADDR + "\n" + sender.get_address() + "\n"+"ACK:" + msg_id))

        elif msg.get_type() == DataMessageType.ENCRYPT_MSG:
            data_split = msg.data.split('\n'.encode())
            next_hop = data_split[0].decode()
            new_data = '\n'.encode().join(data_split[1:])
            print("Next hop ", next_hop)

            self.add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_HOP,IPADDR + "\n" + sender.get_address() + "\n" + next_hop))

            # send message to next hop
            self.swb_sender.send_msg(PersonID(next_hop), new_data)
        
    def on_data(self, sender: PersonID, data: bytes):
        self.swb_sender.on_data(sender, data)
