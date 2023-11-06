


export const processAnwser = async (peer_connection: RTCPeerConnection | null, answer: string | undefined, user_name: String) => {
    if (answer === "") return;

    let answerSdp: RTCSessionDescriptionInit = {
        sdp: answer,
        type: "answer",
    };

    try {
        await peer_connection?.setRemoteDescription(answerSdp);
        console.log("Answer processed successfully");
    } catch (error) {
        console.log("Error in setRemoteDescription: " + error);
    }

};

export const processICE = async (peer_connection: RTCPeerConnection | null, ice: String, user_name: String) => {
    if (ice === "") return;
    let candidates = ice.split("\n");

    for (let cand of candidates) {
        if (cand.trim().length === 0) continue;

        let c: RTCIceCandidate = JSON.parse(cand);
        console.log(c);
        await peer_connection?.addIceCandidate(c);
    }

};

export const processOffer = async (peer_connection: RTCPeerConnection | null, offer: string, user_name: String) => {
    if (offer === "") return;
    if (!peer_connection) return;

    let offerSdp: RTCSessionDescriptionInit = { sdp: offer, type: "offer" };
    try {
        await peer_connection.setRemoteDescription(offerSdp);
        try {
            let answer = await peer_connection.createAnswer();
            await peer_connection.setLocalDescription(answer);
        } catch (error) {
            console.log("Error in createAnswer: " + error);
        }
    } catch (error) {
        console.log("Error in setRemoteDescription: " + error);
    }

}