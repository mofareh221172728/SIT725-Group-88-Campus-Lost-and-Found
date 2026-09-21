const express = require("express");
const adminService = require("../services/admin.service");

// requireAuth and requireAdmin are applied when this router is mounted in server.js.
const router = express.Router();

router.get("/reports/stale-count", async (req, res) => {
  try {
    return res.json(await adminService.getStaleReportCount());
  } catch (error) {
    console.error("Get stale report count error:", error);
    return res.status(500).json({
      message: "Unable to get the stale report count.",
    });
  }
});

router.post("/reports/bulk-actions", async (req, res) => {
  try {
    return res.json(await adminService.runBulkAction(req.body?.action));
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Run bulk action error:", error);
    return res.status(500).json({
      message: "Unable to run the bulk action.",
    });
  }
});

module.exports = router;
