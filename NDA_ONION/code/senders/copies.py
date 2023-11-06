

from dataclasses import dataclass
from typing import List
from personid import PersonID

@dataclass
class Copies:
    total_copies: int
    msg_id: str
    sender: PersonID
    receiver: PersonID
    timeout_time: float
    msg: bytes
    neighbor_blacklist: List[PersonID]

    def add_to_blacklist(self, neighbor: PersonID):
        self.neighbor_blacklist.append(neighbor)

    def is_in_blacklist(self, neighbor: PersonID) -> bool:
        for n in self.neighbor_blacklist:
            if n.get_address() == neighbor.get_address():
                return True
        return False