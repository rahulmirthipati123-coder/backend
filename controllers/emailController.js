
const User= require("../models/User");
const jwt = require("jsonwebtoken");

const { generateOTP } = require("../email/generateOtp");
const { sendOTPEmail } = require("../email/send-otp");

exports.sendOtp = async (req, res) => {
    try{
        const { email, isRegistration = false } = req.body;
        if(!email){
            return res.status(400).json({ message: "Email is required" });
        }

        let user = await User.findOne({ email });

        // For registration, allow sending OTP to new users
        if(!user && !isRegistration){
            return res.status(404).json({ message: "User not found" });
        }

        // For registration, create a temporary user record for OTP storage
        if(!user && isRegistration){
            user = new User({
                email,
                otp: null,
                otpExpires: null,
                // Temporary fields for registration
                isVerified: false
            });
            await user.save();
        }

        const otp = generateOTP();
        user.otp = otp.toString(); // Ensure it's stored as string
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        await sendOTPEmail(email, otp);
        res.status(200).json({
            success: true,
            message: "OTP sent to your email",
            });

    }catch(err){
        res.status(500).json({ message: "Server error" });
    }
}


exports.verifyOtp = async (req, res) => {
    try{
        const { email, otp, isRegistration = false } = req.body;
        if(!email || !otp){
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        // Trim whitespace from inputs
        const trimmedEmail = email.trim();
        const trimmedOtp = otp.toString().trim();

        const user = await User.findOne({ email: trimmedEmail });
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }

        if(!user.otp || user.otp.toString().trim() !== trimmedOtp){
            console.log("OTP mismatch:", {
                stored: user.otp,
                received: trimmedOtp,
                storedType: typeof user.otp,
                receivedType: typeof trimmedOtp
            });
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if(user.otpExpires < Date.now()){
            return res.status(400).json({ message: "OTP expired" });
        }

        // For registration verification, just mark as verified and clean up
        if(isRegistration && !user.username){
            user.otp = undefined;
            user.otpExpires = undefined;
            user.isVerified = true;
            await user.save();
            return res.status(200).json({
                message: "Email verified successfully for registration",
                emailVerified: true
            });
        }

        // For login verification, return full user data
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.status(200).json({
            message: "OTP verified successfully",
            token,
            user: {
                username: user.username,
                email: user.email,
                age: user.age,
                profilePhoto: user.profilePhoto,
            }
        });

    }catch(err){
        res.status(500).json({ message: "Server error" });
    }
}