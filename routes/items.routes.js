const express = require("express");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const requireAuth = require("../middleware/auth.middleware");

const router = express.Router();

const activeReportFilter = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

function toCardItem(report, type, dateField) {
  return {
    id: String(report._id),
    type,
    title: report.title,
    category: report.category,
    location: report.campusLocation,
    date: report[dateField],
    photos: report.photos || [],
    status: report.status || "active",
  };
}

async function getActiveItems(type) {
  const queries = [];

  if (type === "all" || type === "found") {
    queries.push(
      FoundItem.find(activeReportFilter)
        .select("title category campusLocation foundAt photos status")
        .lean()
        .then((reports) =>
          reports.map((report) => toCardItem(report, "found", "foundAt")),
        ),
    );
  }

  if (type === "all" || type === "lost") {
    queries.push(
      LostItem.find(activeReportFilter)
        .select("title category campusLocation lostAt photos status")
        .lean()
        .then((reports) =>
          reports.map((report) => toCardItem(report, "lost", "lostAt")),
        ),
    );
  }

  return (await Promise.all(queries)).flat();
}

router.get("/counts", async (req, res) => {
  try {
    const [found, lost] = await Promise.all([
      FoundItem.countDocuments(activeReportFilter),
      LostItem.countDocuments(activeReportFilter),
    ]);

    return res.json({ all: found + lost, found, lost });
  } catch (error) {
    console.error("Get item counts error:", error);
    return res.status(500).json({ message: "Unable to get item counts." });
  }
});

router.get("/", async (req, res) => {
  try {
    const type = String(req.query.type || "all").toLowerCase();
    const { sort, page, limit } = req.query;
    const items = await getActiveItems(type);

    if (sort === "oldest") {
      items.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === "newest") {
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (page) {
      const pageNumber = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.max(1, parseInt(limit, 10) || 12);
      const total = items.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const startIndex = (pageNumber - 1) * pageSize;

      return res.json({
        items: items.slice(startIndex, startIndex + pageSize),
        total,
        page: pageNumber,
        totalPages,
      });
    }

    return res.json(items);
  } catch (error) {
    console.error("Get items error:", error);
    return res.status(500).json({ message: "Unable to get items." });
  }
});

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
