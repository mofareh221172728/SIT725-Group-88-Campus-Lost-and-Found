"use strict";

const express = require("express");
const helpService = require("../services/help.service");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

// Every Help endpoint needs a logged-in user.
// Owner and admin rules are added in card #119.
router.use(requireAuth);

function sendError(res, error, fallbackMessage) {
  if ([400, 403, 404].includes(error.status)) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({ message: `${fallbackMessage}.` });
}

router.get("/questions", async (req, res) => {
  try {
    return res.json({ questions: await helpService.listMyQuestions(req.session.userId) });
  } catch (error) {
    return sendError(res, error, "Unable to load your help questions");
  }
});

router.post("/questions", async (req, res) => {
  try {
    const question = await helpService.createQuestion(req.session.userId, req.body);
    return res.status(201).json({ message: "Question sent.", question });
  } catch (error) {
    return sendError(res, error, "Unable to send the help question");
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    return res.json({ question: await helpService.getQuestion(req.params.id) });
  } catch (error) {
    return sendError(res, error, "Unable to load the help question");
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const question = await helpService.updateQuestion(req.params.id, req.body);
    return res.json({ message: "Question updated.", question });
  } catch (error) {
    return sendError(res, error, "Unable to update the help question");
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const question = await helpService.deleteQuestion(req.params.id);
    return res.json({ message: "Question deleted.", question });
  } catch (error) {
    return sendError(res, error, "Unable to delete the help question");
  }
});

router.post("/questions/:id/replies", async (req, res) => {
  try {
    const reply = await helpService.addReply(req.params.id, req.session.userId, req.body);
    return res.status(201).json({ message: "Reply sent.", reply });
  } catch (error) {
    return sendError(res, error, "Unable to send the reply");
  }
});

module.exports = router;
