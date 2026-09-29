const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    itemType: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

favouriteSchema.index(
  { userId: 1, itemId: 1, itemType: 1 },
  { unique: true },
);

module.exports = mongoose.model("Favourite", favouriteSchema);