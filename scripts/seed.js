const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");

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
  {
    email: "admin.mock@deakin.edu.au",
    role: "admin",
  },
];

function readImageUrls(fileName) {
  const imageUrlsPath = path.join(__dirname, "../data", fileName);

  return fs
    .readFileSync(imageUrlsPath, "utf8")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean);
}

const foundItemImageUrls = readImageUrls("found-image-urls.txt");
const lostItemImageUrls = readImageUrls("lost-image-urls.txt");

const campusLocations = ["Burwood", "Waurn Ponds", "Waterfront", "Warrnambool"];


function createTitle(fileName) {
  return fileName
    .replace(/\.(jpg|png)$/i, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCategory(fileName) {
  if (
    /(cd|cell-phone|charger|controller|dvd|ear-buds|electrical-outlet|flash-drive|headphones|keyboard|mouse-pad|multimeter|phone|remote-control|television|vcr|vhs|video-game)/.test(
      fileName,
    )
  ) {
    return "Electronics";
  }

  if (/(checkbook|credit-card|wallet)/.test(fileName)) {
    return "Cards & Wallets";
  }

  if (/(car-keys|padlock)/.test(fileName)) {
    return "Keys";
  }

  if (/(box|purse)/.test(fileName)) {
    return "Bags & Backpacks";
  }

  if (
    /(ankle-bracelet|belt|blue-jeans|boots|bracelet|buckle|clothes-hanger|coat|glasses|leg-warmers|neck-tie|overalls|pants|ring|roller-skates|sandals|scarf|scrunchie|shawl|shoes|slippers|socks|stockings|sunglasses|sweater|t-shirt|watch|zipper)/.test(
      fileName,
    )
  ) {
    return "Clothing";
  }

  if (
    /(binder-clip|canvas|chalk|clipboard|colored-pencil|envelope|graph-paper|index-card|junk-mail|letter-opener|magazine|manila-folder|masking-tape|newspaper|notebook|packing-tape|paint-brush|painting-artwork|pen|pencil|photo-album|picture-frame|playing-cards|post-it-notes|push-pin|ruler|sand-paper|scissors|scotch-tape|sharpie|thumb-tack|whiteout)/.test(
      fileName,
    )
  ) {
    return "Books & Stationery";
  }

  return "Other";
}

const DAY_MS = 24 * 60 * 60 * 1000;

// old reports for the admin stale-count and bulk-resolve actions.
// a report is stale when it is active and createdAt is older than 90 days (incident date is not used).
const staleReports = [
  { type: "lost", title: "Old Grey Umbrella", category: "Other", createdDaysAgo: 95 },
  { type: "lost", title: "Old Student Diary", category: "Books & Stationery", createdDaysAgo: 130 },
  { type: "lost", title: "Old Bike Lock Key", category: "Keys", createdDaysAgo: 200 },
  { type: "lost", title: "Old Resolved Scarf", category: "Clothing", createdDaysAgo: 150, status: "resolved" },
  { type: "lost", title: "Recent Report Of An Old Loss", category: "Other", createdDaysAgo: 2, incidentDaysAgo: 200 },
  { type: "found", title: "Old Black Backpack", category: "Bags & Backpacks", createdDaysAgo: 100 },
  { type: "found", title: "Old Student Card", category: "Cards & Wallets", createdDaysAgo: 120 },
  { type: "found", title: "Old Calculator", category: "Electronics", createdDaysAgo: 180 },
  { type: "found", title: "Old Resolved Jacket", category: "Clothing", createdDaysAgo: 150, status: "resolved" },
  { type: "found", title: "Recent Report Of An Old Find", category: "Other", createdDaysAgo: 2, incidentDaysAgo: 200 },
];

async function seedStaleReports(owner) {
  for (const [index, report] of staleReports.entries()) {
    const campusLocation = campusLocations[index % campusLocations.length];
    const createdAt = new Date(Date.now() - report.createdDaysAgo * DAY_MS);
    const incidentAt = new Date(
      Date.now() - (report.incidentDaysAgo ?? report.createdDaysAgo + 1) * DAY_MS,
    );
    const common = {
      ownerId: owner._id,
      title: report.title,
      category: report.category,
      campusLocation,
      photos: [],
      status: report.status || "active",
      createdAt,
      updatedAt: createdAt,
    };

    if (report.type === "lost") {
      await LostItem.updateOne(
        { ownerId: owner._id, title: report.title },
        {
          $setOnInsert: {
            ...common,
            description: `${report.title} was last seen at ${campusLocation} campus.`,
            lostAt: incidentAt,
          },
        },
        // timestamps: false keeps the createdAt above instead of setting it to now.
        { upsert: true, timestamps: false },
      );
    } else {
      await FoundItem.updateOne(
        { ownerId: owner._id, title: report.title },
        {
          $setOnInsert: {
            ...common,
            description: `${report.title} found at ${campusLocation} campus.`,
            foundAt: incidentAt,
            contactMethod: "collection",
            collectionLocation: `${campusLocation} Campus Security`,
          },
        },
        { upsert: true, timestamps: false },
      );
    }
  }
}

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

  const owner = await User.findOne({ email: mockUsers[0].email });
  for (const [index, imageUrl] of foundItemImageUrls.entries()) {
    const fileName = imageUrl.split("/").pop();
    const title = createTitle(fileName);
    const campusLocation = campusLocations[index % campusLocations.length];
    const foundItem = {
      ownerId: owner._id,
      title,
      category: getCategory(fileName),
      description: `${title} found at ${campusLocation} campus.`,
      foundAt: new Date(Date.UTC(2026, 8, 1 - (index % 30))),
      campusLocation,
      photos: [imageUrl],
      contactMethod: "collection",
      collectionLocation: `${campusLocation} Campus Security`,
      status: "active",
    };

    await FoundItem.updateOne(
      { ownerId: owner._id, photos: imageUrl },
      { $setOnInsert: foundItem },
      { upsert: true },
    );
  }

  for (const [index, imageUrl] of lostItemImageUrls.entries()) {
    const fileName = imageUrl.split("/").pop();
    const title = createTitle(fileName);
    const campusLocation = campusLocations[index % campusLocations.length];
    const lostItem = {
      ownerId: owner._id,
      title,
      category: getCategory(fileName),
      description: `${title} was last seen at ${campusLocation} campus.`,
      lostAt: new Date(Date.UTC(2026, 8, 1 - (index % 30))),
      campusLocation,
      photos: [imageUrl],
      status: "active",
    };

    await LostItem.updateOne(
      { ownerId: owner._id, photos: imageUrl },
      { $setOnInsert: lostItem },
      { upsert: true },
    );
  }

  await seedStaleReports(owner);

  console.log(`✅ ${staleReports.length} old reports are ready (${label}).`);
  console.log(`✅ ${foundItemImageUrls.length} found items are ready (${label}).`);
  console.log(`✅ ${lostItemImageUrls.length} lost items are ready (${label}).`);
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
