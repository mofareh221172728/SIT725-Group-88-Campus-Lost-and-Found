const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/user.model");

const envPath = path.join(__dirname, "../.env");
const testEnvPath = path.join(__dirname, "../.env.test");

const env = fs.existsSync(envPath)
  ? dotenv.parse(fs.readFileSync(envPath))
  : null;
const testEnv = fs.existsSync(testEnvPath)
  ? dotenv.parse(fs.readFileSync(testEnvPath))
  : null;

const mockUsers = [
  {
    email: "mock.user@deakin.edu.au",
  },
];

async function seedDatabase(mongoUri, label) {
  await mongoose.connect(mongoUri);

  for (const mockUser of mockUsers) {
    await User.updateOne(
      { email: mockUser.email },
      { $setOnInsert: mockUser },
      { upsert: true },
    );
  }

  console.log(`✅ Mock users are ready (${label}).`);
  await mongoose.disconnect();
}

async function seed() {
  try {
    if (!env?.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env.");
    }

    await seedDatabase(env.MONGODB_URI, "dev");

    if (testEnv?.MONGODB_URI) {
      await seedDatabase(testEnv.MONGODB_URI, "test");
    } else {
      console.log("ℹ️  .env.test was not found, so the test database was skipped.");
    }
  } catch (error) {
    console.error(`❌ Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

seed();
