"use strict";

const mongoose = require("mongoose");
const HelpQuestion = require("../models/helpQuestion.model");
const HelpReply = require("../models/helpReply.model");

const QUESTION_FIELDS = ["title", "body", "category"];
const REPLY_FIELDS = ["body"];

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Accept only a plain object that contains allowed fields.
function pickFields(data, allowedFields, { requireAll }) {
  if (!data || Array.isArray(data) || typeof data !== "object") {
    throw requestError(400, "Request body must be a JSON object.");
  }

  const unsupported = Object.keys(data).filter((key) => !allowedFields.includes(key));
  if (unsupported.length > 0) {
    throw requestError(400, `Unsupported field(s): ${unsupported.join(", ")}.`);
  }

  const picked = {};
  for (const field of allowedFields) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string") {
      throw requestError(400, `${field} must be provided as text.`);
    }
    picked[field] = data[field];
  }

  if (requireAll) {
    const missing = allowedFields.filter(
      (field) => field !== "category" && picked[field] === undefined,
    );
    if (missing.length > 0) {
      throw requestError(400, `${missing.join(", ")} is required.`);
    }
  } else if (Object.keys(picked).length === 0) {
    throw requestError(400, "Provide at least one field to update.");
  }

  return picked;
}

function assertObjectId(id) {
  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    throw requestError(400, "A valid question ID is required.");
  }
}

// Turn Mongoose validation errors into a 400 with the first readable message.
function toRequestError(error) {
  if (error instanceof mongoose.Error.ValidationError) {
    const first = Object.values(error.errors)[0];
    return requestError(400, first ? first.message : "Invalid help data.");
  }
  return error;
}

function questionJson(question) {
  return {
    id: String(question._id),
    ownerId: String(question.ownerId),
    title: question.title,
    body: question.body,
    category: question.category,
    status: question.status,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

function replyJson(reply) {
  return {
    id: String(reply._id),
    questionId: String(reply.questionId),
    authorId: String(reply.authorId),
    body: reply.body,
    createdAt: reply.createdAt,
  };
}

function isAdmin(user) {
  return user.role === "admin";
}

function isOwner(user, question) {
  return String(question.ownerId) === String(user.id);
}

async function findQuestion(id) {
  assertObjectId(id);
  const question = await HelpQuestion.findById(id);
  if (!question) {
    throw requestError(404, "Help question was not found.");
  }
  return question;
}

// Load a question the user is allowed to act on.
// canAdmin: whether an admin may also act on another student's question.
async function findAllowedQuestion(user, id, { canAdmin }) {
  const question = await findQuestion(id);
  if (!isOwner(user, question) && !(canAdmin && isAdmin(user))) {
    throw requestError(403, "You do not have access to this help question.");
  }
  return question;
}

// Students see their own questions. Admins can ask for every question
// with scope "all". Newest first.
async function listQuestions(user, scope) {
  if (scope !== undefined && scope !== "mine" && scope !== "all") {
    throw requestError(400, 'Scope must be either "mine" or "all".');
  }
  if (scope === "all" && !isAdmin(user)) {
    throw requestError(403, "Admin access is required to see all help questions.");
  }

  const filter = scope === "all" ? {} : { ownerId: user.id };
  const questions = await HelpQuestion.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  return questions.map(questionJson);
}

async function createQuestion(user, data) {
  const fields = pickFields(data, QUESTION_FIELDS, { requireAll: true });
  try {
    const question = await HelpQuestion.create({ ...fields, ownerId: user.id });
    return questionJson(question);
  } catch (error) {
    throw toRequestError(error);
  }
}

// One question with its replies, oldest reply first.
// Visible to its owner and to admins.
async function getQuestion(user, id) {
  const question = await findAllowedQuestion(user, id, { canAdmin: true });
  const replies = await HelpReply.find({ questionId: question._id })
    .sort({ createdAt: 1 })
    .lean();
  return { ...questionJson(question), replies: replies.map(replyJson) };
}

// Only the owner can change the wording of a question.
async function updateQuestion(user, id, data) {
  const question = await findAllowedQuestion(user, id, { canAdmin: false });
  const fields = pickFields(data, QUESTION_FIELDS, { requireAll: false });
  question.set(fields);
  try {
    await question.save();
  } catch (error) {
    throw toRequestError(error);
  }
  return questionJson(question);
}

// The owner or an admin can delete a question. Its replies are deleted too.
async function deleteQuestion(user, id) {
  const question = await findAllowedQuestion(user, id, { canAdmin: true });
  await HelpReply.deleteMany({ questionId: question._id });
  await question.deleteOne();
  return { id: String(question._id) };
}

// The owner or an admin can reply. An admin reply marks the question
// "answered"; a follow-up from the owner opens it again.
async function addReply(user, questionId, data) {
  const question = await findAllowedQuestion(user, questionId, { canAdmin: true });
  const fields = pickFields(data, REPLY_FIELDS, { requireAll: true });
  let reply;
  try {
    reply = await HelpReply.create({
      ...fields,
      questionId: question._id,
      authorId: user.id,
    });
  } catch (error) {
    throw toRequestError(error);
  }

  const status = isAdmin(user) && !isOwner(user, question) ? "answered" : "open";
  if (question.status !== status) {
    await HelpQuestion.updateOne({ _id: question._id }, { $set: { status } });
  }

  return { reply: replyJson(reply), questionStatus: status };
}

module.exports = {
  listQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  addReply,
};
