import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
    },
  ],
}, {timestamps:true});

const Room = mongoose.model("Room", RoomSchema);
export default Room;
