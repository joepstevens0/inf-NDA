import sys
from personid import PersonID
from simulationmessage import SimulationMessage, SimulationMessageType
from websock import WebSock
from simulationserver import SimulationServer

sim_server = SimulationServer()
sim_server.start()

websocket_server = WebSock()

def handle_websock_message(msg: SimulationMessage):
    if msg.get_type() is SimulationMessageType.SEND:
        ## forward msg to sender
        data = msg.get_data().split("\n")
        senderId = data[0]
        # receiverId = data[1]
        # msgData = data[2]
        sim_server.send_message(PersonID(senderId), msg)
    elif msg.get_type() is SimulationMessageType.CHANGE_STATUS:
        ## forward msg to id
        data = msg.get_data().split("\n")
        id = data[0]
        sim_server.send_message(PersonID(id), msg)
    elif msg.get_type() is SimulationMessageType.NEW_NEIGHBORS:
        data_list = msg.get_data().split("\n")
        recv = data_list[0]

        # retreive neighbors
        neighbors = []
        for i in range(1, len(data_list)):
            if data_list[i] != "":
                neighbors.append(data_list[i])

        # remove "," in front of ip
        for i in range(1, len(neighbors)):
            neighbors[i] = neighbors[i][1:]

        print("neighbor update:", recv, neighbors)
        
        # send neighbor update to recv
        data = ""
        for neighbor in neighbors:
            data += neighbor + '\n'
        sim_server.send_message(PersonID(recv), SimulationMessage(SimulationMessageType.NEW_NEIGHBORS, data))

        # # add neighbor to others
        # for neighbor in neighbors:
        #     sim_server.send_message(PersonID(neighbor), SimulationMessage(SimulationMessageType.ADD_NEIGHBORS, recv))
        


        


def exit():
    sim_server.stop()

while True:
    try:
        # send logs to websocket
        logs = sim_server.take_logs()
        for msg in logs:
            websocket_server.send_message_websocket_server(msg)

        # take messages from websocket
        messages = websocket_server.take_messages()
        for msg in messages:
            handle_websock_message(msg)


        
    except KeyboardInterrupt:
        print("Keyboard interrupt")
        exit()
        sys.exit()
    except:
        print("App Error:", sys.exc_info()[0])
        exit()
        raise