require("dotenv").config();

const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error("SESSION_SECRET is not defined.");
  process.exit(1);
}

// Parse JSON request bodies
app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

app.use("/api/auth", authRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Temporary in-memory storage
const items = [];

// GET item type counts (overall counts of active lost, found, all items)
app.get("/api/items/counts", (req, res) => {
  const activeItems = items.filter(
    (item) => !item.status || String(item.status).toLowerCase() === "active"
  );

  res.json({
    all: activeItems.length,
    lost: activeItems.filter((i) => i.type && i.type.toLowerCase() === "lost").length,
    found: activeItems.filter((i) => i.type && i.type.toLowerCase() === "found").length,
  });
});

// GET items with filtering, sorting, and pagination
app.get("/api/items", (req, res) => {
  // Only active reports are returned
  const activeItems = items.filter(
    (item) => !item.status || String(item.status).toLowerCase() === "active"
  );

  let result = [...activeItems];
  const { type, sort, page, limit } = req.query;

  // Filter by type (lost / found)
  if (type && type.toLowerCase() !== "all") {
    result = result.filter(
      (item) => item.type && item.type.toLowerCase() === type.toLowerCase()
    );
  }

  // Sort by reported date: newest (descending) or oldest (ascending)
  if (sort === "oldest") {
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === "newest") {
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Pagination (when page query param is supplied)
  if (page) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const total = result.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = result.slice(startIndex, startIndex + limitNum);

    return res.json({
      items: paginatedItems,
      total,
      page: pageNum,
      totalPages,
    });
  }

  res.json(result);
});

// POST a new item
app.post("/api/items", (req, res) => {
  const { type, title, category, date, location, description } = req.body;

  // Required field validation
  if (!type || !title || !category || !date || !location || !description) {
    return res.status(400).json({
      message: "All required fields must be provided.",
    });
  }

  const newItem = {
    id: items.length + 1,
    type,
    title,
    category,
    date,
    location,
    description,
  };

  items.push(newItem);

  return res.status(201).json({
    message: "Report created successfully.",
    item: newItem,
  });
});

// Export (used by tests via Supertest)

module.exports = { app, items };

// Start server
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined.");
    process.exit(1);
  }

  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB");

      app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error.message);
      process.exit(1);
    });
}
