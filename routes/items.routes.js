const express = require("express");
const itemsService = require("../services/items.service");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/counts", async (req, res) => {
  try {
    return res.json(await itemsService.getItemCounts());
  } catch (error) {
    console.error("Get item counts error:", error);
    return res.status(500).json({ message: "Unable to get item counts." });
  }
});

router.get("/", async (req, res) => {
  try {
    return res.json(await itemsService.getItems(req.query));
  } catch (error) {
    console.error("Get items error:", error);
    return res.status(500).json({ message: "Unable to get items." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const report = await itemsService.createReport(req.session.userId, req.body);

    return res.status(201).json({
      message: "Report created successfully.",
      report,
    });
  } catch (error) {
    if (error.status === 400 || error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create report error:", error);

    return res.status(500).json({
      message: "Unable to create report.",
    });
  }
});

module.exports = router;
