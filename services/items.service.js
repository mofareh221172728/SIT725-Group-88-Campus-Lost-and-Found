const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");

const activeReportFilter = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function parseDateFilter(rawValue, parameterName, endOfDay = false) {
  const value = String(rawValue || "").trim();
  if (!value) {

    return null;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    throw validationError(
      `${parameterName} must be a valid date in YYYY-MM-DD format.`,
    );
  }

  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  const date = new Date(`${value}T${time}Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw validationError(
      `${parameterName} must be a valid date in YYYY-MM-DD format.`,
    );
  }

  return date;
}

function toCardItem(report, type, dateField) {
  return {
    id: String(report._id),
    type,
    title: report.title,
    category: report.category,
    location: report.campusLocation,
    date: report[dateField],
    photos: report.photos || [],
    status: report.status || "active",
  };
}

async function getActiveItems(type, keyword = "") {
  const queries = [];
  const matchesKeyword = (report) =>
    !keyword ||
    report.title.toLowerCase().includes(keyword) ||
    (report.description || "").toLowerCase().includes(keyword);

  if (type === "all" || type === "found") {
    queries.push(
      FoundItem.find(activeReportFilter)
        .select("title description category campusLocation foundAt photos status")
        .lean()
        .then((reports) =>
          reports
            .filter(matchesKeyword)
            .map((report) => toCardItem(report, "found", "foundAt")),
        ),
    );
  }

  if (type === "all" || type === "lost") {
    queries.push(
      LostItem.find(activeReportFilter)
        .select("title description category campusLocation lostAt photos status")
        .lean()
        .then((reports) =>
          reports
            .filter(matchesKeyword)
            .map((report) => toCardItem(report, "lost", "lostAt")),
        ),
    );
  }

  return (await Promise.all(queries)).flat();
}

async function getItems({
  type: rawType,
  sort,
  page,
  limit,
  keyword: rawKeyword,
  category: rawCategory,
  location: rawLocation,
  fromDate: rawFromDate,
  toDate: rawToDate,
}) {
  const type = String(rawType || "all").toLowerCase();
  const keyword = String(rawKeyword || "").trim().toLowerCase();
  const category = String(rawCategory || "").trim().toLowerCase();
  const location = String(rawLocation || "").trim().toLowerCase();
  const fromDate = parseDateFilter(rawFromDate, "fromDate");
  const toDate = parseDateFilter(rawToDate, "toDate", true);

  if (fromDate && toDate && fromDate > toDate) {
    throw validationError("fromDate cannot be after toDate.");
  }

  let items = await getActiveItems(type, keyword);

  if (category) {
    items = items.filter(
      (item) => item.category.toLowerCase() === category,
    );
  }

  if (location) {
    items = items.filter((item) =>
      item.location.toLowerCase().includes(location),
    );
  }

  if (fromDate) {
    items = items.filter(
      (item) => new Date(item.date) >= fromDate,
    );
  }

  if (toDate) {
    items = items.filter(
      (item) => new Date(item.date) <= toDate,
    );
  }

  if (sort === "oldest") {
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === "newest") {
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (!page) {
    return items;
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 12);
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (pageNumber - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    total,
    page: pageNumber,
    totalPages,
  };
}

async function getItemCounts() {
  const [found, lost] = await Promise.all([
    FoundItem.countDocuments(activeReportFilter),
    LostItem.countDocuments(activeReportFilter),
  ]);

  return { all: found + lost, found, lost };
}

async function createReport(ownerId, data) {
  const {
    type,
    title,
    category,
    description,
    date,
    location,
    photos = [],
    handoverMethod,
    collectionLocation,
  } = data;

  if (!type || !title || !category || !description || !date || !location) {
    throw validationError("All required fields must be provided.");
  }

  if (!['lost', 'found'].includes(type)) {
    throw validationError('Type must be either "lost" or "found".');
  }

  const reportDate = new Date(date);

  if (Number.isNaN(reportDate.getTime())) {
    throw validationError("A valid date must be provided.");
  }

  if (reportDate > new Date()) {
    throw validationError("Report date cannot be in the future.");
  }

  if (type === "found") {
    if (!["email", "dropoff"].includes(handoverMethod)) {
      throw validationError(
        'Found items must provide handoverMethod as "email" or "dropoff".',
      );
    }

    const contactMethod = handoverMethod === "dropoff" ? "collection" : "email";

    if (contactMethod === "collection" && !collectionLocation) {
      throw validationError(
        "collectionLocation is required when handoverMethod is dropoff.",
      );
    }

    return FoundItem.create({
      ownerId,
      title,
      category,
      description,
      foundAt: reportDate,
      campusLocation: location,
      photos,
      contactMethod,
      collectionLocation:
        contactMethod === "collection" ? collectionLocation : undefined,
    });
  }

  return LostItem.create({
    ownerId,
    title,
    category,
    description,
    lostAt: reportDate,
    campusLocation: location,
    photos,
  });
}

module.exports = {
  activeReportFilter,
  createReport,
  getItemCounts,
  getItems,
};
