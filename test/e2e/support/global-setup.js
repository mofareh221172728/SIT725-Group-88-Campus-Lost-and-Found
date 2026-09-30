const mongoose = require('mongoose');
const User = require('../../../models/user.model');
const db = require('../../helpers/db');
const seed = require('../../helpers/seed');
const { MOCK_USER_EMAIL, OTHER_USER_EMAIL } = require('./test-data');

module.exports = async function globalSetup() {
  await db.connect();

  try {
    await seed.clearAll();
    await User.create([{ email: MOCK_USER_EMAIL }, { email: OTHER_USER_EMAIL }]);
  } finally {
    await mongoose.connection.close();
  }
};
