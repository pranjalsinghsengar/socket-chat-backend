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
      const room = await Room.findOne({ roomName });
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
        console.log("error", "Room not available");
        return;
      }
      const isAlreadyJoined = await isRoomAvailable.participants.includes(
        user_ID
      );
      if (!isAlreadyJoined) {
        isRoomAvailable.participants.push(user_ID);
      }
      await isRoomAvailable.save();
      socket.join(isRoomAvailable._id.toString());
      socket.emit("join room", isRoomAvailable);

      console.log("User Joined in room");
      console.log("isAlreadyJoined", isAlreadyJoined);
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("error", "Server error");
    }
  });

  socket.on("all joined rooms", async ({ user_ID }) => {
    const userInRoom = await Room.find({
      participants: { $in: [user_ID] },
    });
    // console.log(userInRoom);
    socket.emit("all joined rooms", userInRoom);
  });

  socket.on("room users", async ({ user_ID }) => {
    try {
      let userDetails = [];
      for (let id = 0; id < user_ID.length; id++) {
        // console.log("id >>", user_ID[id]);
        const { _id, name, email } = await User.findById(user_ID[id]);
        userDetails.push({ _id, name, email });
      }
      socket.emit("room users", userDetails);
      // console.log("room users >> ", userDetails);
    } catch (error) {
      console.error("Error sending message:", err);
      socket.emit("error", "Server error");
    }
  });

  socket.on("room chat", async ({ roomId, senderId, message }) => {
    // console.log("=====>>>>",roomId, senderId, message)
    try {
      const isRoomAvailable = await Room.findOne({ _id: roomId });

      if (!isRoomAvailable) {
        socket.emit("error", "room chat error from backend");
      }
      console.log(isRoomAvailable);
      isRoomAvailable.messages.push({ senderId, message });
      // socket.emit("room chat", isRoomAvailable)
      isRoomAvailable.save();

      io.to(roomId).emit("room chat", isRoomAvailable);
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("error", "room chat error from backend");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// socket.on("leave room", async ()=>{

// })
