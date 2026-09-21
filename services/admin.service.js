const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const { activeReportFilter } = require("./items.service");

const STALE_AFTER_DAYS = 90;

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

// createdAt is used to check if a report is stale (cut off after 90 days).
// This is used to determine if a report is considered stale and should be counted in the stale report count.
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

// uses the same filter with getStaleReportCount.
// update the status of all stale reports to "resolved" and return the count of updated reports.
async function resolveStaleReports() {
  const filter = getStaleReportFilter();
  const update = { $set: { status: "resolved" } };
  const [lost, found] = await Promise.all([
    LostItem.updateMany(filter, update),
    FoundItem.updateMany(filter, update),
  ]);

  return { count: lost.modifiedCount + found.modifiedCount };
}

// add bulk actions service, currently only supports resolving stale reports
async function runBulkAction(action) {
  switch (action) {
    case "resolve-stale":
      return resolveStaleReports();
    default:
      throw validationError("Unknown bulk action. Supported actions: resolve-stale.");
  }
}

module.exports = {
  getStaleReportCount,
  runBulkAction,
};
