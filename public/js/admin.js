"use strict";

function reportLabel(count) {
  return `${count} ${count === 1 ? "report" : "reports"}`;
}

function showBulkResult(count) {
  const result = document.getElementById("bulk-action-result");

  result.textContent =
    count === 0 ? "No reports to resolve." : `${reportLabel(count)} resolved.`;
  result.classList.remove("d-none");
}

function getReportCheckboxes() {
  return Array.from(
    document.querySelectorAll("#stale-report-list input[type=checkbox]"),
  );
}

function getSelectedReports() {
  return getReportCheckboxes()
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => ({
      type: checkbox.dataset.type,
      id: checkbox.dataset.id,
    }));
}

function updateSelection() {
  const total = getReportCheckboxes().length;
  const selected = getSelectedReports().length;
  const selectAll = document.getElementById("select-all-reports");

  document.getElementById("selected-count").textContent = selected;
  selectAll.disabled = total === 0;
  selectAll.checked = total > 0 && selected === total;
  selectAll.indeterminate = selected > 0 && selected < total;
  document.getElementById("run-bulk-resolve").disabled = selected === 0;
}

function createReportRow(report) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.dataset.type = report.type;
  checkbox.dataset.id = report.id;

  const title = document.createElement("span");
  title.textContent = report.title;
  title.style.cssText =
    "display:block; font-size:.8rem; font-weight:600; overflow-wrap:anywhere;";

  const details = document.createElement("span");
  details.className = "mono";
  details.style.cssText =
    "display:block; font-size:.65rem; color:#9a9a95; overflow-wrap:anywhere;";
  details.textContent = [
    report.type === "lost" ? "Lost" : "Found",
    report.category,
    report.location,
    `Submitted ${String(report.createdAt).slice(0, 10)}`,
  ].join(" · ");

  const text = document.createElement("span");
  text.className = "flex-grow";
  text.style.minWidth = "0";
  text.append(title, details);

  const label = document.createElement("label");
  label.className = "flex items-center gap-2 p-2";
  label.style.cursor = "pointer";
  label.append(checkbox, text);

  const row = document.createElement("li");
  row.style.borderBottom = "1px solid var(--wf-line)";
  row.append(label);

  return row;
}

function renderStaleReports(reports) {
  const empty = document.getElementById("stale-report-empty");

  document
    .getElementById("stale-report-list")
    .replaceChildren(...reports.map(createReportRow));
  empty.textContent = "No reports older than 3 months.";
  empty.classList.toggle("d-none", reports.length > 0);
  updateSelection();
}

async function loadStaleReports() {
  try {
    const [{ reports }, { all }] = await Promise.all([
      api.get("/api/admin/reports/stale"),
      api.get("/api/items/counts"),
    ]);

    document.getElementById("stale-count").textContent = reports.length;
    document.getElementById("active-count").textContent = all;
    renderStaleReports(reports);
  } catch (error) {
    document.getElementById("stale-report-empty").textContent = error.message;
  }
}

function initBulkActions() {
  const runButton = document.getElementById("run-bulk-resolve");
  const selectAll = document.getElementById("select-all-reports");
  const reportList = document.getElementById("stale-report-list");
  const reportPanel = document.getElementById("stale-report-panel");
  const confirmPanel = document.getElementById("bulk-confirm");
  const confirmMessage = document.getElementById("bulk-confirm-message");
  const confirmButton = document.getElementById("bulk-confirm-yes");
  const cancelButton = document.getElementById("bulk-confirm-cancel");

  function closeConfirm() {
    confirmPanel.classList.add("d-none");
    reportPanel.disabled = false;
    updateSelection();
  }

  selectAll.addEventListener("change", () => {
    getReportCheckboxes().forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
    });
    updateSelection();
  });

  reportList.addEventListener("change", updateSelection);

  runButton.addEventListener("click", () => {
    confirmMessage.textContent = `Resolve ${reportLabel(getSelectedReports().length)}? This cannot be undone.`;
    confirmPanel.classList.remove("d-none");
    reportPanel.disabled = true;
    runButton.disabled = true;
    cancelButton.focus();
  });

  cancelButton.addEventListener("click", closeConfirm);

  confirmButton.addEventListener("click", () => {
    closeConfirm();
    // Bulk-actions request is not wired up yet.
  });

  updateSelection();
}

document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("admin-status");
  const content = document.getElementById("admin-content");

  function showMessage(message, isError) {
    status.textContent = message;
    status.classList.toggle("browse-message-error", isError);
  }

  try {
    const { user } = await api.get("/api/auth/me");

    if (user.role !== "admin") {
      showMessage("You are not authorized to view this page.", true);
      return;
    }

    status.classList.add("d-none");
    content.classList.remove("d-none");
    initBulkActions();
    loadStaleReports();
  } catch (error) {
    if (error.status === 401) {
      showMessage("Please log in to view this page. Redirecting to login…", true);
      // Give the user time to read the message before redirecting.
      setTimeout(() => window.location.replace("index.html"), 2000);
      return;
    }

    showMessage("Unable to verify admin access. Please try again.", true);
  }
});
