import socket
from time import sleep
from typing import List
from senders.swbsender import SWBSender
from constants import ALL_NODES
from senders.directsender import DirectSender
from senders.onionsender import OnionSender
from personid import PersonID
from datamessage import DataMessage, DataMessageType
from neighbor import NeighborList
from simulationmessage import SimulationMessage, SimulationMessageType
from simulationsocket import SimulationSocket
from datasocket import DataSocket
from constants import IPADDR
import threading
import sys 
import time

NEIGHBOR_SEARCH_TIME = 5

online_status = True

sim_socket = SimulationSocket()
sim_socket.start()

data_socket = DataSocket()
data_socket.start()

# simulation neighbors
sim_neighbors = NeighborList()

# found neighborlist
neighbor_list = NeighborList()

# recently discovered neighbor list
recent_neighbor_list = NeighborList()

# create log list
sim_logs: List[SimulationMessage] = []

def add_log(info: SimulationMessage):
    sim_logs.append(info)


# receive after parsing from message sender
def on_message_recv(sender: PersonID, data: bytes):
    print("Received from",sender.get_address()," message:" , data.decode())

# message_sender = DirectSender()
# message_sender = SWBSender(on_message_recv, add_log, False)
message_sender = OnionSender(on_message_recv, add_log)

# flood all devices to find data neighbors
def find_neighbors():
    global online_status
    # don't do anything if offline
    if not online_status:
        return
        
    neighbor_str = ""
    
    for personid in ALL_NODES:
        data_socket.send_message(personid, DataMessage(DataMessageType.FIND_NEIGHBOR, "".encode()))
        neighbor_str += str(personid.get_address())

def send_data_message(receiver: PersonID, data: str):
    message = DataMessage(DataMessageType.DATA, data.encode())
    message_sender.send_msg(receiver, message.encode_msg())
    
    print("--Sending message to", receiver.get_address(), ", data:<", data+ ">")
    add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE_ONION_SEND, IPADDR + "\n" + receiver.get_address() + "\n" + data))

def on_message(sender: PersonID, msg: DataMessage):
    global online_status
    # don't do anything if offline
    if not online_status:
        return

    # don't answer nodes that aren't simulation neighbors
    if not sim_neighbors.has_neighbor(sender):
        return

    # add sender to neighbors
    neighbor_list.addNeighbor(sender)
    recent_neighbor_list.addNeighbor(sender)

    # print("Received message from", sender.get_address(), ":\n|||||||||||\n", msg.make_json(), "\n||||||||||||")

    if msg.get_type() == DataMessageType.FIND_NEIGHBOR:
        data_socket.send_message(sender, DataMessage(DataMessageType.FIND_NEIGHBOR_ACK, "".encode()))
    elif msg.get_type() == DataMessageType.FIND_NEIGHBOR_ACK:
        pass
    elif msg.get_type() == DataMessageType.ENCRYPT_MSG:
        print("Got data from", sender.get_address(), ":", msg.get_data())
        
        # call sender ondata function
        message_sender.on_data(sender, msg.get_data())

def on_sim_message(message: SimulationMessage):
    global online_status

    print("Got sim message:\n|||||||||||\n", message.make_json(), "\n|||||||||||||")

    if message.get_type() == SimulationMessageType.CHANGE_STATUS:
        # parse data
        data = message.get_data().split("\n")
        id = data[0]
        state_string = data[1]

        if state_string == "true":
            state = True
        else:
            state = False

        if id == IPADDR:
            online_status = state
        
        add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE,IPADDR + " status now: " + str(online_status)))

        return
    elif message.get_type() == SimulationMessageType.NEW_NEIGHBORS:
        sim_neighbors.clear()
        neighbors = message.get_data().split('\n')
        for neighbor in neighbors:
            if(neighbor.find(".") != -1 and len(neighbor) > 0):
            #if neighbor != "":
                sim_neighbors.addNeighbor(PersonID(neighbor))

        print("--Sim neighbors changed to", sim_neighbors.get())
    
    # don't do anything else if offline
    if not online_status:
        return

    if message.get_type() == SimulationMessageType.SEND:
        data = message.get_data().split("\n")
        senderId = PersonID(data[0])
        receiverId = PersonID(data[1])
        msgData = data[2]

        send_data_message(receiverId, msgData)
    
    # elif message.get_type() == SimulationMessageType.ADD_NEIGHBORS:
    #     neighbors = message.get_data().split('\n')
    #     for neighbor in neighbors:
    #         if neighbor != "":
    #             sim_neighbors.addNeighbor(PersonID(neighbor))
    #  
    #     print("--Sim neighbors added", sim_neighbors.get())


def exit():
    data_socket.stop()
    sim_socket.stop()


find_neighbors()
last_neighbor_search = time.time()

while True:
    try:
        # send logs to simulation socket
        logs = sim_logs
        for log in logs:
            sim_socket.send_message(log)
        sim_logs = []

        # process simulation messages
        messages = sim_socket.take_messages()
        for msg in messages:
            on_sim_message(msg)

        # process incoming messages
        messages = data_socket.take_messages()
        for (sender, msg) in messages:
            on_message(sender, msg)


        # update neighbor list
        current_time = time.time()
        if current_time - last_neighbor_search > NEIGHBOR_SEARCH_TIME:
            # remove old neighbors
            recent_neighbor_list = neighbor_list
            recent_neighbor_list = NeighborList()

            # find neighbors
            find_neighbors()

            last_neighbor_search = current_time
    
        # update message sender
        message_sender.update(data_socket, neighbor_list)

    except KeyboardInterrupt:
        print("Keyboard interrupt")
        exit()
        sys.exit()
    except:
        add_log(SimulationMessage(SimulationMessageType.LOG_MESSAGE, "Error from" + IPADDR +": " + str(sys.exc_info()[0])))
        print("App Error:", sys.exc_info()[0])
        exit()
        raise
