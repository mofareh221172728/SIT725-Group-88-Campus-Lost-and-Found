const FoundItem = require("../models/foundItem.model");
const LostItem = require("../models/lostItem.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

const activeReportFilter = {
  $or: [{ status: "active" }, { status: { $exists: false } }],
};

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requiredText(value, fieldName, minLength = 1, maxLength) {
  if (typeof value !== "string") {
    throw validationError(`${fieldName} must be provided as text.`);
  }

  const sanitized = value.trim();

  if (sanitized.length < minLength) {
    throw validationError(
      minLength === 1
        ? `${fieldName} is required.`
        : `${fieldName} must be at least ${minLength} characters long.`,
    );
  }

  if (maxLength && sanitized.length > maxLength) {
    throw validationError(`${fieldName} cannot exceed ${maxLength} characters.`);
  }

  return sanitized;
}

function reportDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw validationError("A valid date must be provided in YYYY-MM-DD format.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw validationError("A valid date must be provided in YYYY-MM-DD format.");
  }

  if (date > new Date()) {
    throw validationError("Report date cannot be in the future.");
  }

  return date;
}

function sanitizeReportUpdate(type, data) {
  const allowedFields = [
    "title",
    "category",
    "date",
    "description",
    "location",
    "handoverMethod",
    "collectionLocation",
  ];

  if (!data || Array.isArray(data) || typeof data !== "object") {
    throw validationError("Report details must be provided.");
  }

  const unsupportedFields = Object.keys(data).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unsupportedFields.length > 0) {
    throw validationError(
      `Unsupported report fields: ${unsupportedFields.join(", ")}.`,
    );
  }

  const sanitized = {
    title: requiredText(data.title, "Title", 5, 100),
    category: requiredText(data.category, "Category"),
    description: requiredText(data.description, "Description", 10, 1000),
    date: reportDate(data.date),
    location: requiredText(data.location, "Location"),
  };

  if (type === "found") {
    if (!["email", "dropoff"].includes(data.handoverMethod)) {
      throw validationError(
        'Found items must provide handoverMethod as "email" or "dropoff".',
      );
    }

    sanitized.contactMethod =
      data.handoverMethod === "dropoff" ? "collection" : "email";

    if (sanitized.contactMethod === "collection") {
      sanitized.collectionLocation = requiredText(
        data.collectionLocation,
        "Collection location",
      );
    }
  }

  return sanitized;
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

async function getOwnedReports(ownerId) {
  if (!mongoose.isObjectIdOrHexString(ownerId) ||
      !(await User.exists({ _id: ownerId }))) {
    throw requestError(401, "Authentication is required.");
  }

  const [found, lost] = await Promise.all([
    FoundItem.find({ ownerId })
      .select("title category campusLocation foundAt createdAt photos status")
      .sort({ createdAt: -1 })
      .lean(),
    LostItem.find({ ownerId })
      .select("title category campusLocation lostAt createdAt photos status")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    found: found.map((report) => toCardItem(report, "found", "foundAt")),
    lost: lost.map((report) => toCardItem(report, "lost", "lostAt")),
  };
}

function toDetailItem(report, type, dateField) {
  const detail = {
    id: String(report._id),
    type,
    title: report.title,
    category: report.category,
    description: report.description,
    date: report[dateField],
    location: report.campusLocation,
    reportedDate: report.createdAt,
    status: report.status || "active",
    photos: (report.photos || []).slice(0, 3),
  };

  if (type === "found") {
    detail.contactMethod = report.contactMethod;

    if (report.contactMethod === "collection") {
      detail.collectionLocation = report.collectionLocation;
    } else if (report.contactMethod === "email") {
      detail.contactEmail = report.ownerId?.email;
    }
  }

  return detail;
}

function toEditItem(report, type, dateField) {
  const item = {
    id: String(report._id),
    ownerId: String(report.ownerId),
    type,
    title: report.title,
    category: report.category,
    description: report.description,
    date: report[dateField],
    location: report.campusLocation,
    status: report.status || "active",
    photos: (report.photos || []).slice(0, 3),
  };

  if (type === "found") {
    item.handoverMethod =
      report.contactMethod === "collection" ? "dropoff" : "email";
    item.collectionLocation =
      report.contactMethod === "collection"
        ? report.collectionLocation || ""
        : "";
  }

  return item;
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

async function getItemDetail(id, rawType) {
  const type = String(rawType || "").toLowerCase();

  if (!['found', 'lost'].includes(type)) {
    throw validationError('type must be either "found" or "lost".');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  if (type === "found") {
    const report = await FoundItem.findOne({ _id: id, ...activeReportFilter })
      .select("title category description foundAt campusLocation createdAt status photos contactMethod collectionLocation ownerId")
      .populate("ownerId", "email")
      .lean();

    return report ? toDetailItem(report, type, "foundAt") : null;
  }

  const report = await LostItem.findOne({ _id: id, ...activeReportFilter })
    .select("title category description lostAt campusLocation createdAt status photos")
    .lean();

  return report ? toDetailItem(report, type, "lostAt") : null;
}

async function getItemCounts() {
  const [found, lost] = await Promise.all([
    FoundItem.countDocuments(activeReportFilter),
    LostItem.countDocuments(activeReportFilter),
  ]);

  return { all: found + lost, found, lost };
}

async function getOwnedReportForEdit(ownerId, type, id) {
  if (!["found", "lost"].includes(type)) {
    throw validationError('Type must be either "lost" or "found".');
  }

  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    throw validationError("A valid report ID is required.");
  }

  const Model = type === "found" ? FoundItem : LostItem;
  const dateField = type === "found" ? "foundAt" : "lostAt";
  const fields =
    "ownerId title category description campusLocation status photos " +
    `${dateField} contactMethod collectionLocation`;
  const report = await Model.findOne({
    _id: id,
    ownerId,
    status: "active",
  })
    .select(fields)
    .lean();

  if (report) {
    return toEditItem(report, type, dateField);
  }

  if (await Model.exists({ _id: id, ownerId })) {
    throw requestError(403, "Only active reports can be edited.");
  }

  if (await Model.exists({ _id: id })) {
    throw requestError(403, "You can only edit your own reports.");
  }

  throw requestError(404, "Report was not found.");
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

async function updateReport(ownerId, type, id, data) {
  if (!["found", "lost"].includes(type)) {
    throw validationError('Type must be either "lost" or "found".');
  }

  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    throw validationError("A valid report ID is required.");
  }

  const details = sanitizeReportUpdate(type, data);
  const Model = type === "found" ? FoundItem : LostItem;
  const dateField = type === "found" ? "foundAt" : "lostAt";
  const update = {
    $set: {
      title: details.title,
      category: details.category,
      description: details.description,
      [dateField]: details.date,
      campusLocation: details.location,
    },
  };

  if (type === "found") {
    update.$set.contactMethod = details.contactMethod;

    if (details.contactMethod === "collection") {
      update.$set.collectionLocation = details.collectionLocation;
    } else {
      update.$unset = { collectionLocation: "" };
    }
  }

  const report = await Model.findOneAndUpdate(
    { _id: id, ownerId, status: "active" },
    update,
    { new: true, runValidators: true },
  );

  if (report) {
    return report;
  }

  if (await Model.exists({ _id: id, ownerId })) {
    throw requestError(403, "Only active reports can be updated.");
  }

  if (await Model.exists({ _id: id })) {
    throw requestError(403, "Only the report owner can update its details.");
  }

  throw requestError(404, "Report was not found.");
}

module.exports = {
  activeReportFilter,
  createReport,
  getOwnedReports,
  getItemDetail,
  getItemCounts,
  getItems,
  getOwnedReportForEdit,
  updateReport,
};
