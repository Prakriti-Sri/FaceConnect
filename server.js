const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

// Home route - Redirects to a unique room
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Room route - Renders room.ejs with the same roomId for all users
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(`User ${userId} joined room: ${roomId}`);

    // Join the room
    socket.join(roomId);
    
    // Notify others in the room
    socket.to(roomId).emit("user-connected", userId);

    // Chat message broadcasting
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from ${roomId}`);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log("Server is running...");
});
