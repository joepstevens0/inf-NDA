
from typing import List
from constants import IPADDR
from personid import PersonID

class NeighborList:
    list: List[PersonID]

    def __init__(self):
        self.list = []

        # add yourself to neighborlist
        self.list.append(PersonID(IPADDR))

    def addNeighbor(self, neighbor: PersonID):
        # only add if not in list
        for n in self.list:
            if n.get_address() == neighbor.get_address():
                return
        self.list.append(neighbor)
    
    def clear(self):
        self.list.clear()

    def get(self) -> List[PersonID]:
        return self.list

    def has_neighbor(self, id: PersonID) -> bool:
        for p in self.list:
            if p.get_id() == id.get_id():
                return True

        return False