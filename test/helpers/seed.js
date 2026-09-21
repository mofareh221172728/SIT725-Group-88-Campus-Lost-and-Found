"use strict";

/**
 * test/helpers/seed.js
 *
 * Provides repeatable fixture datasets and helper functions
 * to seed and clean test database state for integration testing.
 *
 * Usage in integration tests:
 *   const seed = require("./helpers/seed");
 *   beforeEach(async () => {
 *     await seed.seedAll();
 *   });
 *   afterEach(async () => {
 *     await seed.clearAll();
 *   });
 *
 * Not duplicate of scripts/seed.js, is deterministic fixtures for Mocha hooks.
 */

const mongoose = require("mongoose");
const User = require("../../models/user.model");
const FoundItem = require("../../models/foundItem.model");
const LostItem = require("../../models/lostItem.model");

// Deterministic ObjectIds for repeatable test references
const testUserIds = {
  alice: new mongoose.Types.ObjectId("650000000000000000000001"),
  bob: new mongoose.Types.ObjectId("650000000000000000000002"),
  admin: new mongoose.Types.ObjectId("650000000000000000000003"),
};

const sampleUsers = [
  {
    _id: testUserIds.alice,
    email: "alice.student@deakin.edu.au",
  },
  {
    _id: testUserIds.bob,
    email: "bob.staff@deakin.edu.au",
  },
  {
    _id: testUserIds.admin,
    email: "admin.test@deakin.edu.au",
    role: "admin",
  },
];

const sampleFoundItems = [
  {
    _id: new mongoose.Types.ObjectId("650000000000000000000101"),
    ownerId: testUserIds.alice,
    title: "Blue Hydro Flask Water Bottle",
    category: "Bottles & Containers",
    description: "Stainless steel blue water bottle with Deakin sticker",
    foundAt: new Date("2026-09-01T10:30:00.000Z"),
    campusLocation: "Burwood",
    photos: ["https://example.com/photos/bottle.jpg"],
    contactMethod: "email",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("650000000000000000000102"),
    ownerId: testUserIds.bob,
    title: "Graphing Calculator TI-84",
    category: "Electronics",
    description: "Black Texas Instruments calculator found in Building LA Room 2.10",
    foundAt: new Date("2026-09-02T14:15:00.000Z"),
    campusLocation: "Waurn Ponds",
    photos: ["https://example.com/photos/calc.jpg"],
    contactMethod: "collection",
    collectionLocation: "Waurn Ponds Campus Security",
    status: "active",
  },
];

const sampleLostItems = [
  {
    _id: new mongoose.Types.ObjectId("650000000000000000000201"),
    ownerId: testUserIds.alice,
    title: "Black Leather Bi-fold Wallet",
    category: "Cards & Wallets",
    description: "Contains student ID and driver license, lost near cafe",
    lostAt: new Date("2026-09-03T09:00:00.000Z"),
    campusLocation: "Burwood",
    photos: ["https://example.com/photos/wallet.jpg"],
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("650000000000000000000202"),
    ownerId: testUserIds.bob,
    title: "Wireless Noise Cancelling Earbuds",
    category: "Electronics",
    description: "White earbuds in charging case, lost in student lounge",
    lostAt: new Date("2026-09-04T16:45:00.000Z"),
    campusLocation: "Waurn Ponds",
    photos: [],
    status: "resolved",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS);

// Stale report fixtures for admin stale-count and bulk-action tests.
// Stale threshold: active reports with createdAt older than 90 days.
const sampleStaleFoundItems = [
  {
    // Active, created 100 days ago — counts as stale
    ownerId: testUserIds.alice,
    title: "Stale Found Umbrella",
    category: "Other",
    description: "Umbrella found at Burwood campus entrance.",
    foundAt: daysAgo(101),
    campusLocation: "Burwood",
    photos: [],
    contactMethod: "email",
    status: "active",
  },
  {
    // Resolved, created 110 days ago — does NOT count as stale (already resolved)
    ownerId: testUserIds.alice,
    title: "Stale Resolved Found Keys",
    category: "Keys",
    description: "Keys found at Burwood campus, already resolved.",
    foundAt: daysAgo(111),
    campusLocation: "Burwood",
    photos: [],
    contactMethod: "email",
    status: "resolved",
  },
  {
    // Active, created only 10 days ago — does NOT count as stale (too fresh)
    ownerId: testUserIds.bob,
    title: "Fresh Found Calculator",
    category: "Electronics",
    description: "Calculator found in Building LC room 2.10.",
    foundAt: daysAgo(11),
    campusLocation: "Waurn Ponds",
    photos: [],
    contactMethod: "collection",
    collectionLocation: "Waurn Ponds Campus Security",
    status: "active",
  },
];

const sampleStaleLostItems = [
  {
    // Active, created 200 days ago — counts as stale
    ownerId: testUserIds.bob,
    title: "Stale Lost Laptop Sleeve",
    category: "Bags & Backpacks",
    description: "Laptop sleeve lost at Waterfront campus library.",
    lostAt: daysAgo(201),
    campusLocation: "Waterfront",
    photos: [],
    status: "active",
  },
  {
    // Active, created 1 day ago but incident 400 days ago — does NOT count as stale
    // (stale threshold uses createdAt, not lostAt)
    ownerId: testUserIds.alice,
    title: "Recent Report Of An Old Loss",
    category: "Other",
    description: "Reported today but the item was lost long ago.",
    lostAt: daysAgo(400),
    campusLocation: "Burwood",
    photos: [],
    status: "active",
  },
];

/**
 * Seeds sample users into the database.
 */
async function seedUsers() {
  await User.deleteMany({});
  return User.insertMany(sampleUsers);
}

/**
 * Seeds sample found items into the database.
 */
async function seedFoundItems() {
  await FoundItem.deleteMany({});
  return FoundItem.insertMany(sampleFoundItems);
}

/**
 * Seeds sample lost items into the database.
 */
async function seedLostItems() {
  await LostItem.deleteMany({});
  return LostItem.insertMany(sampleLostItems);
}

/**
 * Seeds stale and fresh report fixtures for admin stale-count and bulk-action tests.
 * Inserts directly with custom createdAt via collection.insertMany to bypass
 * Mongoose auto-timestamps.
 */
async function seedStaleReports() {
  await FoundItem.deleteMany({});
  await LostItem.deleteMany({});

  const now = new Date();
  const foundDocs = sampleStaleFoundItems.map((item) => ({
    ...item,
    createdAt: daysAgo(
      item.title === "Fresh Found Calculator" ? 10
        : item.title === "Stale Resolved Found Keys" ? 110
        : 100,
    ),
    updatedAt: now,
  }));
  const lostDocs = sampleStaleLostItems.map((item) => ({
    ...item,
    createdAt: daysAgo(
      item.title === "Recent Report Of An Old Loss" ? 1 : 200,
    ),
    updatedAt: now,
  }));

  await FoundItem.collection.insertMany(foundDocs);
  await LostItem.collection.insertMany(lostDocs);
}

/**
 * Seeds all sample data (Users, FoundItems, LostItems).
 */
async function seedAll() {
  const users = await seedUsers();
  const foundItems = await seedFoundItems();
  const lostItems = await seedLostItems();
  return { users, foundItems, lostItems };
}

/**
 * Clears all data from User, FoundItem, and LostItem collections.
 */
async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    FoundItem.deleteMany({}),
    LostItem.deleteMany({}),
  ]);
}

module.exports = {
  testUserIds,
  sampleUsers,
  sampleFoundItems,
  sampleLostItems,
  sampleStaleFoundItems,
  sampleStaleLostItems,
  seedUsers,
  seedFoundItems,
  seedLostItems,
  seedStaleReports,
  seedAll,
  clearAll,
};
