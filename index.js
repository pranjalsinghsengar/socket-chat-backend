import io from "socket.io"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.js";
import messageRoute from "./routes/message.route.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
  })
);

dotenv.config();

const PORT = process.env.PORT || 8000;

mongoose
  .connect(
    "mongodb+srv://pranjalsengar:pranjalsengar@cluster0.gdh4ggy.mongodb.net/"
  )
  .then(() => {
    console.log("connected to db");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

app.use("/", userRoute);
app.use("/", messageRoute);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
