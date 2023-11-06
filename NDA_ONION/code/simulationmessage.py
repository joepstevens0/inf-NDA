from enum import Enum
class SimulationMessageType(Enum):
    INIT_MESSAGE = 0
    RECONNECT = 1
    _2 = 2
    RECV = 3
    LOG_MESSAGE = 4
    SEND = 5
    CHANGE_STATUS = 6
    NEW_NEIGHBORS = 9
    LOG_MESSAGE_ONION_SEND_ACK = 10
    LOG_MESSAGE_ONION_SEND = 11
    LOG_MESSAGE_ONION_RECV = 12
    LOG_MESSAGE_ONION_RECV_ACK = 13
    LOG_MESSAGE_HOP = 14
    LOG_MESSAGE_ENCRYPTED = 15
    COPY_UPDATE = 16
    LOG_MESSAGE_SWB_RECV = 17
    LOG_MESSAGE_SWB_RECV_ACK = 18
    

class SimulationMessage:
    msg_type: SimulationMessageType
    data: str

    def __init__(self, msg_type: SimulationMessageType, data: str):
        self.msg_type = msg_type
        self.data = data

    def get_type(self) -> SimulationMessageType:
        return self.msg_type

    def get_data(self) -> str:
        return self.data
    
    def encode_msg(self) -> bytes:
        return self.make_json().encode()


    @staticmethod
    def decode_msg(data: str) -> 'SimulationMessage':
        datalist = data.split("\n")
        msg_type = SimulationMessageType(int(datalist[0]))
        msg_value = data[len(datalist[0]) + 1:]
        return SimulationMessage(msg_type, msg_value)

    def make_json(self) ->str:
        result = ""

        result += str(self.msg_type.value) + '\n'
        result += str(self.data)

        return result
    