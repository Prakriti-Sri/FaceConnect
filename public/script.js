const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: window.location.hostname,
    port: location.protocol === "https:" ? 443 : 3030,  // Fix for Render
});

let myStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream;
    addVideoStream(myVideo, stream);

    // Answer incoming calls
    peer.on("call", call => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    // Notify server when PeerJS is ready
    peer.on("open", id => {
        socket.emit("join-room", ROOM_ID, id);
    });

    // When a new user connects, call them
    socket.on("user-connected", userId => {
        console.log(`User connected: ${userId}`);
        connectToNewUser(userId, stream);
    });

    // Remove user when they disconnect
    socket.on("user-disconnected", userId => {
        console.log(`User disconnected: ${userId}`);
        document.getElementById(userId)?.remove();
    });
});

// Call new user
function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
}

// Add video to the grid
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
}

// Invite button
document.getElementById("inviteButton").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room link copied! Share it with your friends.");
});
