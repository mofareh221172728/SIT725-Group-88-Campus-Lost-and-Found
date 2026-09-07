require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user.model");

const mockUsers = [
  {
    email: "mock.user@deakin.edu.au",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    for (const mockUser of mockUsers) {
      await User.updateOne(
        { email: mockUser.email },
        { $setOnInsert: mockUser },
        { upsert: true },
      );
    }

    console.log("Mock users are ready.");
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
