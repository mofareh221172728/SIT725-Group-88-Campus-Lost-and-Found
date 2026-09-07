const express = require("express");
const User = require("../models/user.model");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Mock user was not found.",
      });
    }

    req.session.userId = user._id.toString();

    res.json({
      message: "Login successful.",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select("email");

    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        message: "User was not found.",
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to get the current user.",
    });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Unable to log out.",
      });
    }

    res.clearCookie("connect.sid");
    res.json({
      message: "Logout successful.",
    });
  });
});

module.exports = router;
