const User = require("../models/user.model");

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function login(email) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    throw validationError("Email is required.");
  }

  return User.findOne({ email: normalizedEmail });
}

function getCurrentUser(userId) {
  return User.findById(userId).select("email");
}

module.exports = {
  getCurrentUser,
  login,
};
