const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const emailRoutes = require("./routes/email");
const smsRoutes = require("./routes/sms");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/email", emailRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/email/send-otp", (req, res) => {
  res.send("Send OTP");
});

app.listen(process.env.PORT, () => {
  console.log("Hello World");
  console.log(`Server running on ${process.env.PORT}`);
});
