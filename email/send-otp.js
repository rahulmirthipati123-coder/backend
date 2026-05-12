const nodeMailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();


const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

exports.sendOTPEmail = async (email, otp) => {
    await transporter.sendMail({
        from: `OTP Verification <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "OTP Verification",
        text: `Your OTP is: ${otp}`,

        html: `<h2>Your OTP is: <b>${otp}</b></h2>
        <p>This OTP is valid for 5 minutes.</p>`,
    });
};