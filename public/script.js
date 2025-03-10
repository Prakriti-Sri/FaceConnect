const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

// Create a new Peer connection
const peer = new Peer(undefined, {
    host: '/',
    port: '443',  // Works for Render deployment
});

let myStream;

// Get the ROOM_ID from URL
console.log("Joining Room:", ROOM_ID);

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream;
    addVideoStream(myVideo, stream);

    // When a new user calls, answer with own stream
    peer.on("call", call => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    // Notify when a new user joins
    socket.on("user-connected", userId => {
        console.log("New user connected:", userId);
        connectToNewUser(userId, stream);
    });

    // Join room with correct ID
    peer.on("open", id => {
        socket.emit("join-room", ROOM_ID, id);
    });
});

// Connect to a new user
function connectToNewUser(userId, stream) {
    console.log(`Connecting to new user: ${userId}`);
    const call = peer.call(userId, stream);
    const video = document.createElement("video");
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
}

// Function to add video streams
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
}

// Mute/Unmute button
document.getElementById("muteButton").addEventListener("click", () => {
    const enabled = myStream.getAudioTracks()[0].enabled;
    myStream.getAudioTracks()[0].enabled = !enabled;
});

// Video On/Off button
document.getElementById("stopVideo").addEventListener("click", () => {
    const enabled = myStream.getVideoTracks()[0].enabled;
    myStream.getVideoTracks()[0].enabled = !enabled;
});

// Chat functionality
const chatMessage = document.getElementById("chat_message");
const sendButton = document.getElementById("send");
sendButton.addEventListener("click", () => {
    let message = chatMessage.value;
    if (message.trim()) {
        socket.emit("message", message);
        chatMessage.value = "";
    }
});

socket.on("createMessage", (message) => {
    const messageElement = document.createElement("p");
    messageElement.innerText = message;
    document.querySelector(".messages").append(messageElement);
});

// Invite button (copy room link)
document.getElementById("inviteButton").addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room link copied! Share it with your friends.");
});
