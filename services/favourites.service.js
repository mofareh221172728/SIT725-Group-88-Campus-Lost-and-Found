"use strict";

const mongoose = require("mongoose");
const Favourite = require("../models/favourite.model");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const User = require("../models/user.model");

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getItemModel(itemType) {
  if (itemType === "lost") return LostItem;
  if (itemType === "found") return FoundItem;

  throw requestError(400, 'itemType must be either "lost" or "found".');
}

async function validateItem(itemId, itemType) {
  if (!mongoose.isObjectIdOrHexString(itemId)) {
    throw requestError(400, "A valid item ID is required.");
  }

  const Model = getItemModel(itemType);
  const item = await Model.exists({ _id: itemId });

  if (!item) {
    throw requestError(404, "Item was not found.");
  }
}

async function validateUser(userId) {
  if (!mongoose.isObjectIdOrHexString(userId) ||
      !(await User.exists({ _id: userId }))) {
    throw requestError(401, "Authentication is required.");
  }
}

async function addFavourite(userId, itemId, itemType) {
  await validateUser(userId);
  await validateItem(itemId, itemType);

  try {
    return await Favourite.findOneAndUpdate(
      { userId, itemId, itemType },
      { $setOnInsert: { userId, itemId, itemType } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const existing = await Favourite.findOne({ userId, itemId, itemType });
    if (existing) {
      return existing;
    }

    throw error;
  }
}

async function getFavourites(userId) {
  await validateUser(userId);

  return Favourite.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

async function removeFavourite(userId, itemId, itemType) {
  await validateUser(userId);
  getItemModel(itemType);

  if (!mongoose.isObjectIdOrHexString(itemId)) {
    throw requestError(400, "A valid item ID is required.");
  }

  return Favourite.findOneAndDelete({
    userId,
    itemId,
    itemType,
  });
}

module.exports = {
  addFavourite,
  getFavourites,
  removeFavourite,
};
