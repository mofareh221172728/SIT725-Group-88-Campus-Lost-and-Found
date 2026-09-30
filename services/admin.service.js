const mongoose = require("mongoose");
const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const { activeReportFilter } = require("./items.service");

const STALE_AFTER_DAYS = 90;

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

// A report is stale when it is active and was created more than 90 days ago.
function getStaleReportFilter() {
  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  return { ...activeReportFilter, createdAt: { $lt: cutoff } };
}

async function getStaleReportCount() {
  const filter = getStaleReportFilter();
  const [lost, found] = await Promise.all([
    LostItem.countDocuments(filter),
    FoundItem.countDocuments(filter),
  ]);

  return { count: lost + found };
}

// Returns the selected ids by type, or null when no selection was sent.
function parseSelectedReports(reports) {
  if (reports === undefined) {
    return null;
  }

  const isValid =
    Array.isArray(reports) &&
    reports.every(
      (report) =>
        ["lost", "found"].includes(report?.type) &&
        mongoose.Types.ObjectId.isValid(report?.id),
    );

  if (!isValid) {
    throw validationError("reports must be a list of { type, id } with type lost or found.");
  }

  const idsOf = (type) => reports.filter((r) => r.type === type).map((r) => r.id);
  return { lost: idsOf("lost"), found: idsOf("found") };
}

// Resolves stale reports (only the selected ones, if given) and returns how many changed.
async function resolveStaleReports(reports) {
  const selected = parseSelectedReports(reports);
  const filter = getStaleReportFilter();
  const filterFor = (type) =>
    selected ? { ...filter, _id: { $in: selected[type] } } : filter;
  const update = { $set: { status: "resolved" } };
  const [lost, found] = await Promise.all([
    LostItem.updateMany(filterFor("lost"), update),
    FoundItem.updateMany(filterFor("found"), update),
  ]);

  return { count: lost.modifiedCount + found.modifiedCount };
}

// Only "resolve-stale" is supported for now.
async function runBulkAction(action, params = {}) {
  switch (action) {
    case "resolve-stale":
      return resolveStaleReports(params.reports);
    default:
      throw validationError("Unknown bulk action. Supported actions: resolve-stale.");
  }
}

function toStaleReport(report, type) {
  return {
    id: String(report._id),
    type,
    title: report.title,
    category: report.category,
    location: report.campusLocation,
    createdAt: report.createdAt,
  };
}

async function getStaleReports() {
  const filter = getStaleReportFilter();
  const fields = "title category campusLocation createdAt";
  const [lost, found] = await Promise.all([
    LostItem.find(filter).select(fields).lean(),
    FoundItem.find(filter).select(fields).lean(),
  ]);

  const reports = [
    ...lost.map((report) => toStaleReport(report, "lost")),
    ...found.map((report) => toStaleReport(report, "found")),
  ].sort((a, b) => a.createdAt - b.createdAt);

  return { reports };
}

module.exports = {
  getStaleReportCount,
  runBulkAction,
  getStaleReports,
};
