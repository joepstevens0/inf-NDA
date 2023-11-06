import React, { useState } from "react";
import Room from "./helper/room";

export default function RoomElement(){
    
    const [roomInfo, set_roomInfo] = useState(new Room());

    return (<div>
        <h2>Room</h2>
    </div>);
};