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

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined.");
  process.exit(1);
}

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

// GET all items
app.get("/api/items", (req, res) => {
  res.json(items);
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

  res.status(201).json({
    message: "Report created successfully.",
    item: newItem,
  });
});

// Connect to MongoDB before starting the server
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
