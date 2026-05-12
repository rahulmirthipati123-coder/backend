
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.emailMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId= decoded._id;
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token (or) expired." });
    }
};