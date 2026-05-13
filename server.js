const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const emailRoutes = require("./routes/email");
const smsRoutes = require("./routes/sms");

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: [
    'https://frontend-olive-gamma-30.vercel.app',
    'https://frontend-ai1cdrd8g-rahul-s-projects11.vercel.app',
    'http://localhost:5173', // For local development
    'http://localhost:3000'  // Alternative local port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
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

app.listen(process.env.PORT, () => {
  console.log("Hello World");
  console.log(`Server running on ${process.env.PORT}`);
});
