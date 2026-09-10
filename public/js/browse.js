// public/js/browse.js
// Card #23: load and display active lost and found reports from the item API.
// Card #57: frontend controls for reported-date sorting and tab filtering.

const ITEMS_PER_PAGE = 12;

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatReportDate(value) {
  if (!value) return 'Date not provided';

  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(dateValue.getTime())) return escapeHTML(value);

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateValue);
}

function getPrimaryPhoto(report) {
  if (report.primaryPhoto) return report.primaryPhoto;
  if (report.photoUrl) return report.photoUrl;
  if (report.imageUrl) return report.imageUrl;
  if (Array.isArray(report.photos) && report.photos.length > 0) return report.photos[0];
  return '';
}

function reportCardHTML(report) {
  const type = String(report.type || '').toLowerCase() === 'lost' ? 'Lost' : 'Found';
  const status = report.status || 'Active';
  const statusClass = String(status).toLowerCase() === 'resolved'
    ? 'badge-resolved'
    : 'badge-active';
  const photo = getPrimaryPhoto(report);
  const reportId = encodeURIComponent(report.id ?? '');

  const photoHTML = photo
    ? `<img class="report-photo" src="${escapeHTML(photo)}" alt="${escapeHTML(report.title || 'Reported item')}">`
    : '<div class="ph report-photo">No photo</div>';

  return `
    <a href="item-detail.html?id=${reportId}" class="no-underline report-card-link">
      <article class="card-wf">
        ${photoHTML}
        <div class="flex justify-between items-center mb-1">
          <span class="badge-wf">${type}</span>
          <span class="badge-wf ${statusClass}">${escapeHTML(status)}</span>
        </div>
        <h3 class="report-card-title">${escapeHTML(report.title || 'Untitled item')}</h3>
        <p class="report-card-meta">${escapeHTML(report.category || 'Category not provided')}</p>
        <p class="report-card-meta">${escapeHTML(report.location || 'Location not provided')}</p>
        <p class="report-card-meta">Reported ${formatReportDate(report.date)}</p>
      </article>
    </a>`;
}

let activeReports = [];

function getSelectedTab() {
  const activeTab = document.querySelector(
    '[data-toggle-group="browse-tab"] [data-toggle-option].active'
  );
  return activeTab ? activeTab.dataset.toggleOption : 'found';
}

function renderReportedItems(selectedType = 'all') {
  const grid = document.getElementById('report-grid');
  const statusMessage = document.getElementById('browse-status');
  const countLabel = document.getElementById('browse-count');

  if (!grid || !statusMessage) return;

  if (countLabel) {
    if (activeReports.length > ITEMS_PER_PAGE) {
      countLabel.textContent = `Showing 1–${ITEMS_PER_PAGE} of ${activeReports.length} reports`;
    } else {
      countLabel.textContent = activeReports.length === 1
        ? '1 report'
        : `${activeReports.length} reports`;
    }
  }

  if (activeReports.length === 0) {
    grid.innerHTML = '';

    statusMessage.textContent = selectedType === 'all'
      ? 'No active reports are available.'
      : `No active ${selectedType} reports are available.`;

    statusMessage.classList.remove('browse-message-error');
    statusMessage.hidden = false;
    return;
  }

  const displayedReports = activeReports.slice(0, ITEMS_PER_PAGE);
  grid.innerHTML = displayedReports.map(reportCardHTML).join('');
  statusMessage.classList.remove('browse-message-error');
  statusMessage.hidden = true;
}

// Fetch all reports once to populate tab badge counts: Found (x), Lost (y), All (z)
async function updateTabCounts() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) return;
    const data = await res.json();
    const all = Array.isArray(data) ? data : (data.items || []);
    const active = all.filter((r) => !r.status || String(r.status).toLowerCase() === 'active');

    const foundCount = active.filter((r) => String(r.type || '').toLowerCase() === 'found').length;
    const lostCount = active.filter((r) => String(r.type || '').toLowerCase() === 'lost').length;

    const tabGroup = document.querySelector('[data-toggle-group="browse-tab"]');
    if (!tabGroup) return;

    const foundTab = tabGroup.querySelector('[data-toggle-option="found"]');
    const lostTab = tabGroup.querySelector('[data-toggle-option="lost"]');
    const allTab = tabGroup.querySelector('[data-toggle-option="all"]');

    if (foundTab) foundTab.textContent = `Found (${foundCount})`;
    if (lostTab) lostTab.textContent = `Lost (${lostCount})`;
    if (allTab) allTab.textContent = `All (${active.length})`;
  } catch (e) {
    // Non-blocking
  }
}

// Loads reports from the API.
// Backend (server.js / MongoDB in Card #27) handles all filtering & sorting.
async function loadReportedItems(typeOverride) {
  const grid = document.getElementById('report-grid');
  const statusMessage = document.getElementById('browse-status');
  const countLabel = document.getElementById('browse-count');

  if (!grid || !statusMessage) return;

  const selectedType = typeOverride || getSelectedTab();
  const sortSelect = document.getElementById('browse-sort');
  const sortOrder = sortSelect ? sortSelect.value : 'newest';

  try {
    const params = new URLSearchParams();
    if (selectedType && selectedType !== 'all') {
      params.append('type', selectedType);
    }
    if (sortOrder) {
      params.append('sort', sortOrder);
    }

    const url = params.toString() ? `/api/items?${params}` : '/api/items';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`GET ${url} returned ${response.status}`);
    }

    const data = await response.json();
    const reports = Array.isArray(data)
      ? data
      : (data.items || data.reports || []);

    activeReports = reports.filter((report) => (
      !report.status || String(report.status).toLowerCase() === 'active'
    ));

    renderReportedItems(selectedType);
  } catch (error) {
    console.error('Error loading reports:', error);
    activeReports = [];
    grid.innerHTML = '';
    if (countLabel) countLabel.textContent = '';
    statusMessage.textContent = 'Unable to load reports. Please try again.';
    statusMessage.classList.add('browse-message-error');
    statusMessage.hidden = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const browseTabs = document.querySelector(
    '[data-toggle-group="browse-tab"]'
  );

  if (browseTabs) {
    browseTabs.addEventListener('toggle-change', (event) => {
      loadReportedItems(event.detail.value);
    });
  }

  const sortSelect = document.getElementById('browse-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      loadReportedItems();
    });
  }

  updateTabCounts();
  loadReportedItems();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHTML,
    formatReportDate,
    loadReportedItems,
  };
}
