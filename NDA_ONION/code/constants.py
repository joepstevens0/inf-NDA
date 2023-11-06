import socket

from personid import PersonID

HOSTNAME = socket.gethostname()   
IPADDR = socket.gethostbyname(HOSTNAME)  
DATA_PORT = 20001

SOCKET_BUFFER_SIZE = 1024

RESEND_DATA_MESSAGE_TIME = 5
MESSAGE_SEND_DELAY = 5


#need to find better option for switching
# SIMSERVER_ADDR_PORT = ("172.20.96.1", SIM_PORT)
# SIMSERVER_ADDR_PORT = ("192.168.1.152", SIM_PORT)

def ip_to_id(ip: str) -> int:
    return int(ip.split(".")[3])

def id_to_ip(id: int) -> str:
    ip_parts = IPADDR.split(".")
    return ip_parts[0] + "." + ip_parts[1] + "." + ip_parts[2] + "." + str(id)

ALL_NODES = [
    PersonID("172.18.0.2"),
    PersonID("172.18.0.3"),
    PersonID("172.18.0.4"),
    PersonID("172.18.0.5"),
    PersonID("172.18.0.6"),
    # PersonID("172.18.0.7"),
    # PersonID("172.18.0.8"),
    # PersonID("172.18.0.9"),
    # PersonID("172.18.0.10"),
    # PersonID("172.18.0.11"),
]

ONIONS_HOPS = 1
