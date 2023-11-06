import socket

HOSTNAME = socket.gethostname()   
IPADDR = socket.gethostbyname(HOSTNAME)  
PORT = 20002

SOCKET_BUFFER_SIZE = 1024

MAX_CLIENTS = 20

def ip_to_id(ip: str) -> int:
    return int(ip.split(".")[3])