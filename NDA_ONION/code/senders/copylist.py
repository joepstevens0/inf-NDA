



import time
from typing import List
from constants import IPADDR
from personid import PersonID
from senders.copies import Copies


class CopyList:
    list: List[Copies]

    def __init__(self):
        self.list = []
    
    def get(self) -> List[Copies]:
        return self.list

    def set(self, list: List[Copies]):
        self.list = list
    
    def add_copies(self, copies: Copies):
        # check if already has copies of the message
        for c in self.list:
            if copies.msg_id == c.msg_id:
                # add the copies
                c.total_copies += copies.total_copies
                c.timeout_time = max(c.timeout_time, copies.timeout_time)
                c.neighbor_blacklist.extend(copies.neighbor_blacklist)
                return

        ### new copies
        # add copies to list
        self.list.append(copies)


    def remove_by_id(self, id: str):
        for copy in self.list:
            if copy.msg_id == id:
                self.list.remove(copy)
                return

    def remove_copies(self, copies: Copies):
        # remove from list
        self.list.remove(copies)

    def has_copies(self, copies: Copies) -> bool:
        for c in self.list:
            if c.msg_id == copies.msg_id:
                return True
        return False

    def remove_timeouts(self) -> List[Copies]:
        timeouts: List[Copies] = []
        for copy in self.list:
            if time.time() > copy.timeout_time:
                print("timeout triggered")

                # remove copy
                self.list.remove(copy)
                timeouts.append(copy)

        return timeouts