const express = require("express");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      type,
      title,
      category,
      description,
      date,
      location,
      photos = [],
      handoverMethod,
      collectionLocation,
    } = req.body;

    // Required fields
    if (
      !type ||
      !title ||
      !category ||
      !description ||
      !date ||
      !location
    ) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    // Validate report type
    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({
        message: 'Type must be either "lost" or "found".',
      });
    }

    // Validate date
    const reportDate = new Date(date);

    if (Number.isNaN(reportDate.getTime())) {
      return res.status(400).json({
        message: "A valid date must be provided.",
      });
    }

    if (reportDate > new Date()) {
      return res.status(400).json({
        message: "Report date cannot be in the future.",
      });
    }

    const ownerId = req.session.userId;

    let report;

    if (type === "found") {
      if (!["email", "dropoff"].includes(handoverMethod)) {
        return res.status(400).json({
          message:
            'Found items must provide handoverMethod as "email" or "dropoff".',
        });
      }

      const contactMethod =
        handoverMethod === "dropoff" ? "collection" : "email";

      if (contactMethod === "collection" && !collectionLocation) {
        return res.status(400).json({
          message:
            "collectionLocation is required when handoverMethod is dropoff.",
        });
      }

      report = await FoundItem.create({
        ownerId,
        title,
        category,
        description,
        foundAt: reportDate,
        campusLocation: location,
        photos,
        contactMethod,
        collectionLocation:
          contactMethod === "collection" ? collectionLocation : undefined,
      });
    } else {
      report = await LostItem.create({
        ownerId,
        title,
        category,
        description,
        lostAt: reportDate,
        campusLocation: location,
        photos,
      });
    }

    return res.status(201).json({
      message: "Report created successfully.",
      report,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
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