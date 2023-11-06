

from typing import Tuple

class PersonID:
    def __init__(self, address: str):
        self.ip = address

    def get_address(self) -> str:
        return self.ip

    def get_id(self) -> int:
        return int(self.ip.split(".")[3])