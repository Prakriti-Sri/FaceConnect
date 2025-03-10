const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");

const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// Redirect only if there's NO roomId
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);  // Generates a new room only once
});

// When someone joins a room via link, use the existing room ID
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Handle socket connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined Room: ${roomId}`);
    
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log("Server is running on port 3030");
});
