const mongoose =
  require("mongoose");

const userSchema =
  new mongoose.Schema({
    username: String,

    email: {
      type: String,
      unique: true,
    },

    password: String,

    age: Number,
    phone: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    profilePhoto: String,
    otp: String,
    otpExpires: Date,
  }, { timestamps: true });

module.exports =
  mongoose.model(
    "User",
    userSchema
  );