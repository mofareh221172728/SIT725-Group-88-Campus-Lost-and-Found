const mongoose = require('mongoose');
const db = require('../../helpers/db');
const seed = require('../../helpers/seed');

module.exports = async function globalTeardown() {
  await db.connect();

  try {
    await seed.clearAll();
  } finally {
    await mongoose.connection.close();
  }
};
