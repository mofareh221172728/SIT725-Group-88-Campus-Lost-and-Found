const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const { activeReportFilter } = require("./items.service");

const STALE_AFTER_DAYS = 90;

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

module.exports = {
  getStaleReportCount,
};
