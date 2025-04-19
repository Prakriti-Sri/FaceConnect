const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: location.port || (location.protocol === "https:" ? 443 : 3030),
});

let myStream;

// Get user media (video & audio)
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  myStream = stream;
  addVideoStream(myVideo, myStream);

  peer.on("call", (call) => {
    call.answer(myStream);
    const userVideo = document.createElement("video");
    call.on("stream", (userStream) => {
      addVideoStream(userVideo, userStream);
    });
  });

  socket.on("user-connected", (userId) => {
    connectToNewUser(userId, stream);
  });

  // Handle Mute/Unmute
  document.getElementById("muteButton").addEventListener("click", () => {
    const enabled = myStream.getAudioTracks()[0].enabled;
    myStream.getAudioTracks()[0].enabled = !enabled;
    document.getElementById("muteButton").innerHTML = enabled 
      ? `<i class="fa fa-microphone-slash"></i>` 
      : `<i class="fa fa-microphone"></i>`;
  });

  // Handle Video On/Off
  document.getElementById("stopVideo").addEventListener("click", () => {
    const enabled = myStream.getVideoTracks()[0].enabled;
    myStream.getVideoTracks()[0].enabled = !enabled;
    document.getElementById("stopVideo").innerHTML = enabled 
      ? `<i class="fa fa-video-slash"></i>` 
      : `<i class="fa fa-video-camera"></i>`;
  });
});

// Connect to new users
peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, prompt("Enter your name"));
});

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const userVideo = document.createElement("video");
  call.on("stream", (userStream) => {
    addVideoStream(userVideo, userStream);
  });
}

// Add video stream to grid
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

// Handle chat messaging
const chatInput = document.getElementById("chat_message");
const sendButton = document.getElementById("send");
const messagesContainer = document.querySelector(".messages");

sendButton.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  let message = chatInput.value.trim();
  if (message.length === 0) return;
  
  socket.emit("message", message);
  appendMessage(`You: ${message}`);
  chatInput.value = "";
}

socket.on("createMessage", (message, userName) => {
  appendMessage(`${userName}: ${message}`);
});

function appendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messagesContainer.append(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

document.getElementById("inviteButton").addEventListener("click", () => {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("Room link copied! Share it with others."))
    .catch(err => console.error("Failed to copy: ", err));
});
