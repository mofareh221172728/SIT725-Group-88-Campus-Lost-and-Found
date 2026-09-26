"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("search-filter-form");
  const grid = document.getElementById("search-grid");
  const results = document.getElementById("search-results");
  const status = document.getElementById("search-status");
  const count = document.getElementById("search-count");
  const sort = document.getElementById("search-sort");
  const typeButtons = form.querySelectorAll("[data-toggle-option]");
  const fields = {
    keyword: document.getElementById("filter-keyword"),
    category: document.getElementById("filter-category"),
    location: document.getElementById("filter-building"),
    fromDate: document.getElementById("filter-from-date"),
    toDate: document.getElementById("filter-to-date"),
  };
  let selectedType = "all";
  let latestRequest = 0;

  function selectType(type) {
    selectedType = type;
    typeButtons.forEach((button) => {
      const active = button.dataset.toggleOption === type;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function showMessage(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("browse-message-error", isError);
    status.hidden = false;
  }

  function addText(parent, tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function createCard(report) {
    const link = document.createElement("a");
    link.className = "no-underline report-card-link";
    link.href = `item-detail.html?id=${encodeURIComponent(report.id)}&type=${encodeURIComponent(report.type)}`;
    const card = document.createElement("article");
    card.className = "card-wf";
    link.append(card);

    const placeholder = addText(card, "div", "ph report-photo", "No photo");
    const photo = Array.isArray(report.photos) ? report.photos[0] : "";
    if (photo) {
      try {
        const photoUrl = new URL(photo, window.location.href);
        if (["http:", "https:"].includes(photoUrl.protocol)) {
          const image = document.createElement("img");
          image.className = "report-photo";
          image.alt = report.title || "Reported item";
          image.loading = "lazy";
          image.src = photoUrl.href;
          image.addEventListener("error", () => image.replaceWith(placeholder));
          placeholder.replaceWith(image);
        }
      } catch (error) {
        // Keep the placeholder when a stored photo URL is invalid.
      }
    }

    const type = report.type === "lost" ? "Lost" : "Found";
    const badges = document.createElement("div");
    badges.className = "flex justify-between items-center mb-1";
    card.append(badges);
    addText(badges, "span", "badge-wf", type);
    addText(badges, "span", "badge-wf badge-active", "Active");
    addText(card, "h3", "report-card-title", report.title || "Untitled item");
    addText(card, "p", "report-card-meta", report.category || "Category not provided");
    addText(card, "p", "report-card-meta", report.location || "Location not provided");

    const date = new Date(report.date);
    const dateLabel = report.date && !Number.isNaN(date.getTime())
      ? `${type} on ${new Intl.DateTimeFormat("en-AU", {
        day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
      }).format(date)}`
      : "Date not provided";
    addText(card, "p", "report-card-meta", dateLabel);
    return link;
  }

  async function loadReports() {
    // A slow earlier response must not replace a newer search or reset.
    const requestId = ++latestRequest;
    grid.replaceChildren();
    count.textContent = "";
    results.setAttribute("aria-busy", "false");

    if (fields.fromDate.value && fields.toDate.value &&
        fields.fromDate.value > fields.toDate.value) {
      showMessage("From date must be on or before to date.", true);
      return;
    }

    const params = new URLSearchParams();
    Object.entries(fields).forEach(([name, input]) => {
      const value = input.value.trim();
      if (value) params.set(name, value);
    });
    if (selectedType !== "all") params.set("type", selectedType);
    params.set("sort", sort.value);

    results.setAttribute("aria-busy", "true");
    showMessage("Loading reports...");

    try {
      // Without pagination parameters, the API returns all matching reports.
      const reports = await api.get(`/api/items?${params}`);
      if (requestId !== latestRequest) return;
      if (!Array.isArray(reports)) throw new Error("Invalid report response.");

      count.textContent = `${reports.length} ${reports.length === 1 ? "result" : "results"}`;
      if (reports.length === 0) {
        showMessage("No active reports match your search. Try changing or clearing the filters.");
        return;
      }

      grid.replaceChildren(...reports.map(createCard));
      status.hidden = true;
    } catch (error) {
      if (requestId !== latestRequest) return;
      showMessage(error.status === 400
        ? error.message
        : "Unable to load reports. Please try again.", true);
    } finally {
      if (requestId === latestRequest) results.setAttribute("aria-busy", "false");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadReports();
  });

  typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectType(button.dataset.toggleOption);
      form.requestSubmit();
    });
  });

  sort.addEventListener("change", () => form.requestSubmit());

  document.getElementById("clear-filters").addEventListener("click", () => {
    form.reset();
    selectType("all");
    sort.value = "newest";
    loadReports();
  });

  loadReports();
});
