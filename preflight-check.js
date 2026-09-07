const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/user.model");

const envPath = path.join(__dirname, ".env");

function checkEnvironment() {
  if (!fs.existsSync(envPath)) {
    throw new Error(".env file was not found.");
  }

  console.log("✅ .env file was found.");

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error(`Unable to read .env: ${result.error.message}`);
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in .env.");
  }

  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  console.log("✅ MONGODB_URI is valid.");

  if (process.env.PORT) {
    const port = Number(process.env.PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("PORT must be a number between 1 and 65535.");
    }
  }

  console.log("✅ PORT is valid.");

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not defined in .env.");
  }

  console.log("✅ SESSION_SECRET is defined.");
}

async function checkDatabase() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("✅ Connected to MongoDB.");

  await mongoose.connection.db.admin().ping();
  console.log("✅ MongoDB ping succeeded.");

  const mockUser = await User.exists({
    email: "mock.user@deakin.edu.au",
  });

  if (!mockUser) {
    throw new Error("Mock user was not found. Run npm run seed.");
  }

  console.log("✅ Mock user was found.");
}

async function runPreflightCheck() {
  try {
    checkEnvironment();
    await checkDatabase();
    console.log("✅ Preflight check passed.");
  } catch (error) {
    console.error(`❌ Preflight check failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runPreflightCheck();
