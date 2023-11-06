
from enum import Enum
from typing import Type, Union

class DataMessageType(Enum):
    FIND_NEIGHBOR = 0
    FIND_NEIGHBOR_ACK = 1
    DATA = 2
    DATA_ACK = 3
    ENCRYPT_MSG = 4

class DataMessage:
    msg_type: DataMessageType
    data: bytes

    def __init__(self, msg_type: DataMessageType, data: bytes):
        self.msg_type = msg_type
        self.data = data

    def get_type(self) -> DataMessageType:
        return self.msg_type

    def get_data(self):
        return self.data
    
    def encode_msg(self) -> bytes:
        return (str(self.msg_type.value) + '\n').encode() + self.data


    @staticmethod
    def decode_msg(data: bytes) -> 'DataMessage':
        datalist = data.split("\n".encode())
        msg_type = DataMessageType(int(datalist[0]))
        msg_value = data[len(datalist[0]) + 1:]
        return DataMessage(msg_type, msg_value)

    # def make_json(self) ->str:
    #     result = ""

    #     result += str(self.msg_type.value) + '\n'
    #     result += str(self.data)

    #     return result