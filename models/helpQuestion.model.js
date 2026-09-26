const mongoose = require("mongoose");

// Categories match the FAQ filter chips on public/help.html.
const HELP_CATEGORIES = [
  "getting-started",
  "reporting",
  "finding",
  "managing",
  "other",
];
const HELP_STATUSES = ["open", "answered"];

// A question a student asks on the Help page.
// Students see their own questions; admins can see and answer all of them.
const helpQuestionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [5, "Title must be at least 5 characters."],
      maxlength: [150, "Title must be 150 characters or fewer."],
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Question must be at least 10 characters."],
      maxlength: [2000, "Question must be 2000 characters or fewer."],
    },
    category: {
      type: String,
      enum: HELP_CATEGORIES,
      default: "other",
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: HELP_STATUSES,
      default: "open",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("HelpQuestion", helpQuestionSchema);
module.exports.HELP_CATEGORIES = HELP_CATEGORIES;
module.exports.HELP_STATUSES = HELP_STATUSES;
