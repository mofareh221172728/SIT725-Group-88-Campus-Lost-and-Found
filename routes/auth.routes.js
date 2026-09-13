const express = require("express");
const authService = require("../services/auth.service");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const user = await authService.login(req.body.email);

    if (!user) {
      return res.status(401).json({
        message: "Mock user was not found.",
      });
    }

    req.session.userId = user._id.toString();

    return res.json({
      message: "Login successful.",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        message: "User was not found.",
      });
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
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
    return res.json({
      message: "Logout successful.",
    });
  });
});

module.exports = router;
