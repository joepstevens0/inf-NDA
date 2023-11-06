import PeerConnection from "./peerConnection";



export default class ConnectionList {

    constructor() {
        this.peer_connections = new Map<String, PeerConnection>();
    }

    getConnection(id:String): PeerConnection|undefined {
        return this.peer_connections.get(id);
    }

    setConnection(id: String, peer_connection: PeerConnection){
        this.peer_connections.set(id, peer_connection);
    }

    deleteConnection(id:String){
        this.peer_connections.delete(id);
    }

    peer_connections: Map<String, PeerConnection>;
};