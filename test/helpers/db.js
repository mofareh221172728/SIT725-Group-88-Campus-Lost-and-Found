"use strict";

/**
 * test/helpers/db.js
 *
 * Manages the Mongoose connection lifecycle for test suites.
 * Connects to the real test database defined in .env.test (MONGODB_URI).
 *
 * Usage in a test file:
 *   const db = require("./helpers/db");
 *   before(db.connect);
 *   afterEach(db.clearCollections);
 *   after(db.disconnect);
 *
 * IMPORTANT: MONGODB_URI in .env.test must point to a dedicated test
 * database (e.g. sit725-group-88-test), never dev or production.
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

/**
 * Guards against .env.test being missing/misconfigured and tests
 * silently dropping the dev database instead.
 */
function assertSafeTestDatabase(uri) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      'Refusing to run: NODE_ENV must be "test". Check that .env.test is present and loaded.'
    );
  }

  const dbName = (/\/([^/?]+)(\?|$)/.exec(uri) || [])[1] || "";

  if (!dbName.toLowerCase().includes("test")) {
    throw new Error(
      `Refusing to run: database name "${dbName}" does not look like a test database (expected it to include "test"). Check MONGODB_URI in .env.test.`
    );
  }

  const devEnvPath = path.join(__dirname, "../../.env");
  if (fs.existsSync(devEnvPath)) {
    const devEnv = dotenv.parse(fs.readFileSync(devEnvPath));
    if (devEnv.MONGODB_URI && devEnv.MONGODB_URI === uri) {
      throw new Error(
        "Refusing to run: MONGODB_URI in .env.test matches the development database in .env. Point .env.test at a separate test database."
      );
    }
  }
}

/**
 * Connects Mongoose to the test database defined in MONGODB_URI.
 * Call this in a Mocha `before()` hook.
 */
async function connect() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Check your .env.test file."
    );
  }

  assertSafeTestDatabase(uri);

  await mongoose.connect(uri);
}

/**
 * Clears all collections in the test database.
 * Call this in a Mocha `afterEach()` hook to keep tests isolated.
 */
async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Drops the test database and closes the connection. Call in `after()`.
 * Re-checks the guard here as a destructive step.
 */
async function disconnect() {
  assertSafeTestDatabase(process.env.MONGODB_URI);

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

module.exports = { connect, clearCollections, disconnect };

