"use strict";

const mongoose = require("mongoose");

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const photoSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true,
      validate: {
        validator: (data) => data.length <= MAX_PHOTO_SIZE_BYTES,
        message: "A photo cannot exceed 5MB.",
      },
    },
    contentType: {
      type: String,
      required: true,
      enum: ["image/jpeg", "image/png"],
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: MAX_PHOTO_SIZE_BYTES,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Photo", photoSchema);
