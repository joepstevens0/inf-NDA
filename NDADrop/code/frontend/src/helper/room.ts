import ConnectionList from "./connectionlist";


export default class Room{

    constructor(){
        this.peer_connections = new ConnectionList();
    }

    


    peer_connections: ConnectionList;
};