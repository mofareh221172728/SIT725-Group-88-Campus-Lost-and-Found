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

async function findQuestion(id) {
  assertObjectId(id);
  const question = await HelpQuestion.findById(id);
  if (!question) {
    throw requestError(404, "Help question was not found.");
  }
  return question;
}

// Questions asked by the current user, newest first.
async function listMyQuestions(userId) {
  const questions = await HelpQuestion.find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .lean();
  return questions.map(questionJson);
}

async function createQuestion(userId, data) {
  const fields = pickFields(data, QUESTION_FIELDS, { requireAll: true });
  try {
    const question = await HelpQuestion.create({ ...fields, ownerId: userId });
    return questionJson(question);
  } catch (error) {
    throw toRequestError(error);
  }
}

// One question with its replies, oldest reply first.
async function getQuestion(id) {
  const question = await findQuestion(id);
  const replies = await HelpReply.find({ questionId: question._id })
    .sort({ createdAt: 1 })
    .lean();
  return { ...questionJson(question), replies: replies.map(replyJson) };
}

async function updateQuestion(id, data) {
  const question = await findQuestion(id);
  const fields = pickFields(data, QUESTION_FIELDS, { requireAll: false });
  question.set(fields);
  try {
    await question.save();
  } catch (error) {
    throw toRequestError(error);
  }
  return questionJson(question);
}

// Deleting a question also deletes its replies.
async function deleteQuestion(id) {
  const question = await findQuestion(id);
  await HelpReply.deleteMany({ questionId: question._id });
  await question.deleteOne();
  return { id: String(question._id) };
}

async function addReply(questionId, userId, data) {
  const question = await findQuestion(questionId);
  const fields = pickFields(data, REPLY_FIELDS, { requireAll: true });
  try {
    const reply = await HelpReply.create({
      ...fields,
      questionId: question._id,
      authorId: userId,
    });
    return replyJson(reply);
  } catch (error) {
    throw toRequestError(error);
  }
}

module.exports = {
  listMyQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  addReply,
};
