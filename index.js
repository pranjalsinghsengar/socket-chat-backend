const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser")
const userRoute = require("./routes/user");
const messageRoute = require("./routes/message.route");
const { default: mongoose } = require("mongoose");
const { HandlerSignUp } = require("./controller/user");
const dotenv = require("dotenv");

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
  });

app.use("/", userRoute);
app.use("/", messageRoute);

app.listen(8000, () => {
  console.log(`server is running on port ${PORT}`);
});
