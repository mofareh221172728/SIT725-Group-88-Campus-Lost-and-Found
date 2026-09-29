"use strict";

const mongoose = require("mongoose");
const Favourite = require("../models/favourite.model");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");

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

async function addFavourite(userId, itemId, itemType) {
  await validateItem(itemId, itemType);

  const existing = await Favourite.findOne({
    userId,
    itemId,
    itemType,
  });

  if (existing) {
    return existing;
  }

  return Favourite.create({
    userId,
    itemId,
    itemType,
  });
}

async function getFavourites(userId) {
  return Favourite.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

async function removeFavourite(userId, itemId, itemType) {
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