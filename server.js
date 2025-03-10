const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");

const io = require("socket.io")(server, {
  cors: {
    origin: "*"
  }
});

const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// Homepage: Shows a button to create a new room
app.get("/", (req, res) => {
  res.render("index"); // Render the homepage instead of redirecting
});

// When a room ID is provided, render the room page
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(process.env.PORT || 3030);
