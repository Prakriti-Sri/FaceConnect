const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  }
});

const { ExpressPeerServer } = require("peer");
const opinions = { debug: true };

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// Redirect to a new unique room only on first visit
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Serve the room page
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Handle WebSocket Connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room: ${roomId}`);

    // Broadcast to other users that a new user joined
    socket.to(roomId).emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    // Notify when user disconnects
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from ${roomId}`);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log("Server is running on port 3030");
});
