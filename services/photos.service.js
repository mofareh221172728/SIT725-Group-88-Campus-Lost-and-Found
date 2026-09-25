"use strict";

const mongoose = require("mongoose");
const Photo = require("../models/photo.model");

async function createPhotos(files = []) {
  if (files.length === 0) {
    return [];
  }

  return Photo.insertMany(
    files.map((file) => ({
      data: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
    })),
  );
}

async function deletePhotos(ids = []) {
  if (ids.length === 0) {
    return;
  }

  await Photo.deleteMany({ _id: { $in: ids } });
}

async function getPhoto(id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return null;
  }

  return Photo.findById(id).select("data contentType").lean();
}

module.exports = {
  createPhotos,
  deletePhotos,
  getPhoto,
};
