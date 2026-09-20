const express = require("express");
const itemsService = require("../services/items.service");
const reportStatusService = require("../services/report-status.service");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/counts", async (req, res) => {
  try {
    return res.json(await itemsService.getItemCounts());
  } catch (error) {
    console.error("Get item counts error:", error);
    return res.status(500).json({
      message: "Unable to get item counts.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    return res.json(await itemsService.getItems(req.query));
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Get items error:", error);
    return res.status(500).json({
      message: "Unable to get items.",
    });
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

router.put("/:type/:id/status", requireAuth, async (req, res) => {
  try {
    const report = await reportStatusService.resolveReport(
      req.session.userId, req.params.type, req.params.id, req.body,
    );
    return res.json({ message: "Report marked as resolved.", report });
  } catch (error) {
    if ([400, 401, 403, 404, 409].includes(error.status)) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Resolve report error:", error);
    return res.status(500).json({ message: "Unable to resolve report." });
  }
});

module.exports = router;
