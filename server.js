require("dotenv").config();

const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const itemsRoutes = require("./routes/items.routes");
const photosRoutes = require("./routes/photos.routes");
const adminRoutes = require("./routes/admin.routes");
const helpRoutes = require("./routes/help.routes");
const requireAuth = require("./middleware/auth.middleware");
const requireAdmin = require("./middleware/requireAdmin.middleware");

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
app.use("/api/items", itemsRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/api/help", helpRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));


// Unknown API routes answer in JSON; unknown pages show the 404 page.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route was not found." });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

// Export (used by tests via Supertest)
module.exports = { app };

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
