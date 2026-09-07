const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const envPath = path.join(__dirname, ".env");
const testEnvPath = path.join(__dirname, ".env.test");

// Load both env files upfront 
const env = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : null;
const testEnv = fs.existsSync(testEnvPath) ? dotenv.parse(fs.readFileSync(testEnvPath)) : null;

function checkEnvironment() {
  if (!env) {
    throw new Error(".env file was not found.");
  }

  console.log("✅ .env file was found.");

  const mongoUri = env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in .env.");
  }

  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  console.log("✅ MONGODB_URI is valid.");

  if (env.PORT) {
    const port = Number(env.PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("PORT must be a number between 1 and 65535.");
    }
  }

  console.log("✅ PORT is valid.");
}

function checkTestEnvironment() {
  if (!testEnv) {
    console.log("ℹ️  .env.test not found (copy .env.test.example to .env.test to run tests).");
    return;
  }

  console.log("✅ .env.test file was found.");

  // NODE_ENV must be set as "test"
  if (testEnv.NODE_ENV !== "test") {
    throw new Error("NODE_ENV must be 'test' in .env.test.");
  }

  console.log("✅ .env.test NODE_ENV is 'test'.");

  const testMongoUri = testEnv.MONGODB_URI;

  if (!testMongoUri) {
    throw new Error("MONGODB_URI is not defined in .env.test.");
  }

  if (!testMongoUri.startsWith("mongodb://") && !testMongoUri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI in .env.test must start with mongodb:// or mongodb+srv://.");
  }

  // Ensure the test database is not the same as the development database to prevent data loss
  if (testMongoUri === env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI in .env.test must be different from .env to prevent accidental data loss."
    );
  }

  console.log("✅ .env.test MONGODB_URI is valid and is different from .env.");

  if (testEnv.PORT) {
    const port = Number(testEnv.PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("PORT in .env.test must be a number between 1 and 65535.");
    }
  }

  console.log("✅ .env.test PORT is valid.");
}

async function checkDatabase(mongoUri, label) {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`✅ Connected to MongoDB (${label}).`);

  await mongoose.connection.db.admin().ping();
  console.log(`✅ MongoDB ping succeeded (${label}).`);

  await mongoose.disconnect();
}

async function runPreflightCheck() {
  try {
    checkEnvironment();
    checkTestEnvironment();
    await checkDatabase(env.MONGODB_URI, "dev");
    if (testEnv) {
      await checkDatabase(testEnv.MONGODB_URI, "test");
    }
    console.log("✅ Preflight check passed.");
  } catch (error) {
    console.error(`❌ Preflight check failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runPreflightCheck();
