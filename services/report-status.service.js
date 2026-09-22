"use strict";

const mongoose = require("mongoose");
const User = require("../models/user.model");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function resolveReport(userId, type, id, data) {
  if (!["found", "lost"].includes(type)) {
    throw requestError(400, 'Type must be either "lost" or "found".');
  }
  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    throw requestError(400, "A valid report ID is required.");
  }
  if (!data || Array.isArray(data) || data.status !== "resolved" ||
      Object.keys(data).some((key) => key !== "status")) {
    throw requestError(400, 'Provide only status: "resolved".');
  }
  if (!mongoose.isObjectIdOrHexString(userId) ||
      !(await User.exists({ _id: userId }))) {
    throw requestError(401, "Authentication is required.");
  }

  const Model = type === "found" ? FoundItem : LostItem;
  // Check ownership and the current status in the same database write.
  // Legacy reports without a status are active in the existing Browse API.
  const report = await Model.findOneAndUpdate(
    {
      _id: id,
      ownerId: userId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    },
    { $set: { status: "resolved" } },
    { returnDocument: "after", runValidators: true },
  );
  if (report) {
    return { id: String(report._id), type, status: report.status };
  }

  const existing = await Model.findById(id).select("ownerId status").lean();
  if (!existing) {
    throw requestError(404, "Report was not found.");
  }
  if (String(existing.ownerId) !== String(userId)) {
    throw requestError(403, "Only the report owner can change its status.");
  }
  throw requestError(409, "Only active reports can be marked as resolved.");
}

module.exports = { resolveReport };
