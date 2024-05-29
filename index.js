import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.js";
import messageRoute from "./routes/message.route.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./schemas/message.js";
import User from "./schemas/userSchemas.js";
import Conversation from "./schemas/conversation.js";
import Room from "./schemas/room.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
  })
);

const PORT = process.env.PORT || 8000;

mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb+srv://pranjalsengar:pranjalsengar@cluster0.gdh4ggy.mongodb.net/",
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

app.use("/users", userRoute);
app.use("/messages", messageRoute);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // socket.on("message",async (data) => {
  //   console.log("message received", data);
  //   const currentMessage = new Message({senderId: data.senderId , receiverId: data.receiverId , message: data.message})
  //   currentMessage.save()
  //   socket.emit("currentMessage",currentMessage)
  // })

  socket.on("login", async () => {
    try {
      const users = await User.find({}, "_id email name"); // Adjust the fields as per your User schema
      socket.emit("userlist", users);
      // =======================================
      const message = await Message.find({}, "_id senderId receiverId message");
      socket.emit("message", message);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  });

  socket.on("start conversation", async ({ user1_ID, user2_ID }) => {
    try {
      let conversation = await Conversation.findOne({
        participants: { $all: [user1_ID, user2_ID] },
      });

      if (!conversation) {
        conversation = new Conversation({ participants: [user1_ID, user2_ID] });
        await conversation.save();
        console.log("new conversation created");
      }

      socket.join(conversation._id.toString());
      socket.emit("conversation started", conversation);
    } catch (err) {
      console.error("Error starting conversation:", err);
      socket.emit("error", "Server error");
    }
  });

  socket.on("chat message", async ({ conversationId, senderId, message }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit("error", "Conversation not found");
        return;
      }
      const newMessage = { senderId, message };
      conversation.messages.push(newMessage);
      conversation.lastUpdated = Date.now();

      await conversation.save();
      io.to(conversationId).emit("chat message", newMessage);
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("error", "Server error");
    }
  });

  socket.on("create room", async ({ roomName, user_ID }) => {
    try {
      const room = await Room.findById({ roomName });
      if (room) {
        socket.emit("error", "Room already exists");
        console.log("Room already exists");
        return;
      }
      const newRoom = new Room({ roomName: roomName, participants: [user_ID] });
      newRoom.save();
      console.log("new room created", newRoom);
      socket.emit("create room", newRoom);
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("error", "Server error");
    }
  });

  socket.on("join room", async ({ roomName, user_ID }) => {
    try {
      const isRoomAvailable = await Room.findOne({ roomName });
      if (!isRoomAvailable) {
        socket.emit("error", "Room not available");
      }
      isRoomAvailable.participants.push(user_ID);
      
      await isRoomAvailable.save();

      socket.emit("join room", isRoomAvailable)
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("error", "Server error");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
