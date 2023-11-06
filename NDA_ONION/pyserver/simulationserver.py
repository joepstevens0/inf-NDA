from ast import Tuple
import struct
import threading
import socket
import select
import sys
from typing import List

from connection import Connection

from constants import IPADDR, PORT, MAX_CLIENTS, SOCKET_BUFFER_SIZE
from personid import PersonID
from simulationmessage import SimulationMessage

class SimulationServer:

    def __init__(self):
        self.listen_socket = socket.socket(family=socket.AF_INET, type=socket.SOCK_STREAM)

        # write my ip to file
        HOSTNAME = socket.gethostname()   
        IPADDR = socket.gethostbyname(HOSTNAME)  

        ip_file = open("../code/simulation_ip.py", "w")
        ip_file.write("SIM_PORT = " + str(PORT) + "\n")
        ip_file.write("SIMSERVER_ADDR_PORT = (\"" + IPADDR + "\", SIM_PORT)")
        ip_file.close()



        # Bind to address and ip
        self.listen_socket.bind((IPADDR, PORT))
        self.listen_socket.listen(MAX_CLIENTS)

        self.connections = []

    def handle_new_client(self):
        client_socket, address = self.listen_socket.accept()

        connection = Connection()
        self.connections.append((client_socket,connection))
        print("Connection from", address)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.serverloop)
        self.thread.start()
        print("Simulation server started")

    def stop(self):
        self.running = False
        self.thread.join()
        print("Simulation server stopped")
    
    def handle_write(self, socket: socket.SocketType, conn: Connection):
        if not conn.need_writing():
            return
        try:
            for msg in conn.get_writebuffer():
                # Prefix each message with a 4-byte length (network byte order)
                msg = struct.pack('>I', len(msg)) + msg
                socket.sendall(msg)
            conn.clear_writebuffer()
        except:
            print("Error writing to client:", sys.exc_info()[0])
    
    def recv_msg(self, sock: socket.SocketType) -> bytes:
        # Read message length and unpack it into an integer
        raw_msglen = self.recvall(sock, 4)
        if not raw_msglen:
            return b""
        msglen = struct.unpack('>I', raw_msglen)[0]
        # Read the message data
        return self.recvall(sock, msglen)

    def recvall(self, sock: socket.SocketType, n: int) -> bytes:
        # Helper function to recv n bytes or return empty bytes if EOF is hit
        data = bytearray()
        while len(data) < n:
            packet = sock.recv(n - len(data))
            if not packet:
                return b""
            data.extend(packet)
        return data

    def handle_read(self, socket: socket.SocketType, conn: Connection):
        data = self.recv_msg(socket)
        if data:
            conn.on_recv(data)
        else:
            # no data, close connection
            self.close_client(socket, conn)

    def close_client(self, socket: socket.SocketType, conn: Connection):
        socket.close()
        self.connections.remove((socket, conn))
        print("Connection closed with client", conn.get_id().get_address())

    def send_message(self, receiver: PersonID, msg: SimulationMessage):
        for (sock, conn) in self.connections:
            if conn.get_id().get_address() == receiver.get_address():
                conn.send_message(msg)
                return
        print("Failed to send message to client:", receiver.get_address())


    def get_connection_from_socket(self, socket):
        for (s, conn) in self.connections:
            if s is socket:
                return conn
        return False

    def take_logs(self) -> List[SimulationMessage]:
        messages = []
        for (s, conn) in self.connections:
            logs = conn.take_logs()
            messages.extend(logs)
            
        return messages


    def serverloop(self):
        while self.running:
            # calc readable sockets
            read_list = [self.listen_socket]
            for (s, conn) in self.connections:
                read_list.append(s)
            write_list = []
            for (s, conn) in self.connections:
                if conn.need_writing():
                    write_list.append(s)

            readable, writable, errored = select.select(read_list, write_list, [], 1)


            # read from sockets
            for s in readable:
                if s is self.listen_socket:
                    self.handle_new_client()
                else:
                    conn = self.get_connection_from_socket(s)
                    if conn:
                        self.handle_read(s, conn)
            
            # write to sockets
            for s in writable:
                conn = self.get_connection_from_socket(s)
                if conn:
                    self.handle_write(s, conn)

