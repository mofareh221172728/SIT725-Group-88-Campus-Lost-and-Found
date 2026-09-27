"use strict";

const express = require("express");
const helpService = require("../services/help.service");
const authService = require("../services/auth.service");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

// Every Help endpoint needs a logged-in user whose account still exists.
// The user's role decides what they can see and change (see help.service.js).
router.use(requireAuth);
router.use(async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Authentication is required." });
    }
    req.helpUser = { id: String(user._id), role: user.role };
    return next();
  } catch (error) {
    console.error("Load help user error:", error);
    return res.status(500).json({ message: "Unable to verify your session." });
  }
});

function sendError(res, error, fallbackMessage) {
  if ([400, 403, 404].includes(error.status)) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({ message: `${fallbackMessage}.` });
}

// ?scope=all lists every question and is for admins only.
router.get("/questions", async (req, res) => {
  try {
    const questions = await helpService.listQuestions(req.helpUser, req.query.scope);
    return res.json({ questions });
  } catch (error) {
    return sendError(res, error, "Unable to load help questions");
  }
});

router.post("/questions", async (req, res) => {
  try {
    const question = await helpService.createQuestion(req.helpUser, req.body);
    return res.status(201).json({ message: "Question sent.", question });
  } catch (error) {
    return sendError(res, error, "Unable to send the help question");
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    return res.json({ question: await helpService.getQuestion(req.helpUser, req.params.id) });
  } catch (error) {
    return sendError(res, error, "Unable to load the help question");
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const question = await helpService.updateQuestion(req.helpUser, req.params.id, req.body);
    return res.json({ message: "Question updated.", question });
  } catch (error) {
    return sendError(res, error, "Unable to update the help question");
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const question = await helpService.deleteQuestion(req.helpUser, req.params.id);
    return res.json({ message: "Question deleted.", question });
  } catch (error) {
    return sendError(res, error, "Unable to delete the help question");
  }
});

router.post("/questions/:id/replies", async (req, res) => {
  try {
    const { reply, questionStatus } = await helpService.addReply(
      req.helpUser,
      req.params.id,
      req.body,
    );
    return res.status(201).json({ message: "Reply sent.", reply, questionStatus });
  } catch (error) {
    return sendError(res, error, "Unable to send the reply");
  }
});

module.exports = router;
