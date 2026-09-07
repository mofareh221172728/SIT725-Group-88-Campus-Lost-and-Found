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

const mongoose = require("mongoose");

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
 * Drops the test database and closes the Mongoose connection.
 * Call this in a Mocha `after()` hook.
 */
async function disconnect() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

module.exports = { connect, clearCollections, disconnect };

