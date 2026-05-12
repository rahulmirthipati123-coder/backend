const router = require("express").Router();

const auth =
  require("../middleware/authMiddleware");

const User = require("../models/User");

router.get(
  "/profile",
  auth,
  async (req, res) => {
    const user = await User.findById(
      req.user.id
    ).select("-password");

    res.json(user);
  }
);

module.exports = router;