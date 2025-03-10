const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peer = new Peer(undefined, {
    host: '/',
    port: '443', // Ensure it works with Render
});

let myStream;

// Get user media and connect
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", call => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on("user-connected", userId => {
        connectToNewUser(userId, stream);
    });
});

// Connect to room with correct ID
peer.on("open", id => {
    socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
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
const muteButton = document.getElementById("muteButton");
muteButton.addEventListener("click", () => {
    const enabled = myStream.getAudioTracks()[0].enabled;
    myStream.getAudioTracks()[0].enabled = !enabled;
    muteButton.classList.toggle("muted");
});

// Video On/Off button
const stopVideoButton = document.getElementById("stopVideo");
stopVideoButton.addEventListener("click", () => {
    const enabled = myStream.getVideoTracks()[0].enabled;
    myStream.getVideoTracks()[0].enabled = !enabled;
    stopVideoButton.classList.toggle("stopped");
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
