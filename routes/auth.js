const router =
  require("express").Router();

const multer = require("multer");
const User =
  require("../models/User");

const bcrypt =
  require("bcryptjs");

const jwt =
  require("jsonwebtoken");

const { generateOTP } = require("../email/generateOtp");
const { sendOTPEmail } = require("../email/send-otp");

const upload = multer({ storage: multer.memoryStorage() });


// REGISTER
router.post(
  "/register",
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        age,
        phone,
      } = req.body;

      const profilePhoto = req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        : undefined;

      if (!username || !email || !password || !age || !phone) {
        return res.status(400).json({ msg: "All fields are required" });
      }

      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser && existingPhoneUser.email !== email && existingPhoneUser.username) {
        return res.status(400).json({ msg: "Phone number is already registered" });
      }

      const existing = await User.findOne({ email });

      if (existing && existing.username) {
        return res.status(400).json({ msg: "User already exists" });
      }

      if (!existing || !existing.isVerified) {
        return res.status(400).json({
          msg: "Please verify your email before completing registration",
        });
      }

      if (!existing.phoneVerified) {
        return res.status(400).json({
          msg: "Please verify your phone number before completing registration",
        });
      }

      const hashed = await bcrypt.hash(password, 10);

      let user;
      if (existing && !existing.username) {
        user = existing;
        user.username = username;
        user.password = hashed;
        user.age = age;
        user.phone = phone;
        user.profilePhoto = profilePhoto;
        user.isVerified = true;
        user.phoneVerified = true;
      } else {
        user = new User({
          username,
          email,
          password: hashed,
          age,
          phone,
          profilePhoto,
          isVerified: true,
          phoneVerified: true,
        });
      }

      await user.save();

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        msg: "Registration completed successfully",
        token,
        user: {
          username: user.username,
          email: user.email,
          age: user.age,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
        },
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);

router.post(
  "/register/verify-otp",
  async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          msg: "Email and OTP are required",
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          msg: "User not found",
        });
      }

      if (user.isVerified) {
        return res.status(400).json({
          msg: "User already verified",
        });
      }

      if (!user.otp || user.otp !== otp) {
        return res.status(400).json({
          msg: "Invalid OTP",
        });
      }

      if (user.otpExpires < Date.now()) {
        return res.status(400).json({
          msg: "OTP expired",
        });
      }

      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        msg: "Registration verified successfully",
        token,
        user: {
          username: user.username,
          email: user.email,
          age: user.age,
          profilePhoto: user.profilePhoto,
        },
      });
    } catch (err) {
      res.status(500).json(err);
    }
  }
);


// LOGIN
router.post(
  "/login",
  async (req, res) => {

    try {

      const {
        email,
        password,
      } = req.body;

      // Find user
      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res.status(400).json({
          msg:
            "User not found",
        });
      }

      // Compare password
      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          msg:
            "Invalid password",
        });
      }

      if (!user.isVerified) {
        return res.status(401).json({
          msg:
            "Email is not verified",
        });
      }

      res.json({
        msg: "Credentials verified, please complete OTP",
        success: true
      });

    } catch (err) {

      res.status(500).json(err);
    }
  }
);


module.exports = router;