require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

// Setup Express App
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Message Schema & Model
const MessageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  receiverName: String, // Added receiverName field
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", MessageSchema);

// Get Recent Chats
app.get("/recent-chats/:user", async (req, res) => {
  const { user } = req.params;
  
  // Find distinct chat partners
  const chats = await Message.aggregate([
    { $match: { $or: [{ sender: user }, { receiver: user }] } },
    { $sort: { timestamp: -1 } },
    { $group: {
      _id: { $cond: [{ $eq: ["$sender", user] }, "$receiver", "$sender"] },
      receiverName: { $first: "$receiverName" }, // Include receiverName
      lastMessage: { $first: "$message" },
      timestamp: { $first: "$timestamp" }
    }},
    { $sort: { timestamp: -1 } }
  ]);

  res.json(chats);
});

// Setup Socket.IO
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a private room
  socket.on("joinChat", ({ sender, receiver }) => {
    const chatRoom = [sender, receiver].sort().join("_");
    socket.join(chatRoom);
  });

  // Send & Save Message
  socket.on("sendMessage", async ({ sender, receiver, receiverName, message }) => {
    console.log("Message:", sender, receiver,receiverName, message);
    const chatRoom = [sender, receiver].sort().join("_");
    const newMessage = new Message({ sender, receiver, receiverName, message });
    await newMessage.save();

    io.to(chatRoom).emit("receiveMessage", { sender, message });
  });

  // Load chat history
  socket.on("loadMessages", async ({ sender, receiver }) => {
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    }).sort({ timestamp: 1 });

    socket.emit("chatHistory", messages);
  });

  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
