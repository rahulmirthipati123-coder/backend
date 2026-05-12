const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        msg: "No token",
      });
    }

    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = verified;

    next();

  } catch (err) {
    res.status(401).json({
      msg: "Invalid token",
    });
  }
};

module.exports = authMiddleware;