const mongoose = require("mongoose");

const lostItemSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    lostAt: {
      type: Date,
      required: true,
    },
    campusLocation: {
      type: String,
      required: true,
      trim: true,
    },
    photos: {
      type: [String],
      validate: {
        validator: (photos) => photos.length <= 3,
        message: "A lost item report can contain up to three photos.",
      },
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LostItem", lostItemSchema);
