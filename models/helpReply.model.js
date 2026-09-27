const mongoose = require("mongoose");

// A reply in a Help question thread, written by an admin or by the
// student who owns the question.
const helpReplySchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HelpQuestion",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Reply must be at least 2 characters."],
      maxlength: [1000, "Reply must be 1000 characters or fewer."],
    },
  },
  {
    timestamps: true,
  },
);

// Replies are always loaded per question, oldest first.
helpReplySchema.index({ questionId: 1, createdAt: 1 });

module.exports = mongoose.model("HelpReply", helpReplySchema);
