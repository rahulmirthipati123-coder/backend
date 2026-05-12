const User = require("../models/User");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

exports.sendOtp = async (req, res) => {
  try {
    const { phone, email, isRegistration = false } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (isRegistration && !email) {
      return res.status(400).json({ message: "Email is required for registration phone verification" });
    }

    const userByPhone = await User.findOne({ phone });

    if (isRegistration && userByPhone && userByPhone.username) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    if (!isRegistration && !userByPhone) {
      return res.status(404).json({ message: "User not found with this phone number" });
    }

    if (isRegistration) {
      let user = await User.findOne({ email });

      if (user && user.username && user.phone && user.phone !== phone) {
        return res.status(400).json({ message: "This email is already associated with a different phone number" });
      }

      if (!user) {
        user = new User({ email, phone, isVerified: false, phoneVerified: false });
      } else {
        if (user.phone && user.phone !== phone) {
          return res.status(400).json({ message: "This account already has a different phone number" });
        }
        user.phone = phone;
      }

      await user.save();
    }

    const verification = await client.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: phone, channel: "sms" });

    res.status(200).json({
      success: true,
      message: "SMS OTP sent to your phone",
      status: verification.status,
    });
  } catch (err) {
    console.error("Twilio send error:", err);
    res.status(500).json({ message: err.message || "Failed to send SMS OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, email, isRegistration = false } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    const verificationCheck = await client.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: phone, code: otp });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (isRegistration) {
      if (!email) {
        return res.status(400).json({ message: "Email is required for phone registration verification" });
      }

      let user = await User.findOne({ email });

      if (!user) {
        user = new User({ email, phone, isVerified: false, phoneVerified: true });
      } else {
        user.phone = phone;
        user.phoneVerified = true;
      }

      await user.save();

      return res.status(200).json({
        message: "Phone number verified successfully",
        phoneVerified: true,
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone,
        age: user.age,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    console.error("Twilio verify error:", err);
    res.status(500).json({ message: err.message || "Failed to verify OTP" });
  }
};
