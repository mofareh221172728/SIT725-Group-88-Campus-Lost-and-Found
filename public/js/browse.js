// public/js/browse.js

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
let currentPage = 1;
let totalPages = 1;
let totalReports = 0;

function getSelectedTab() {
  const activeTab = document.querySelector(
    '[data-toggle-group="browse-tab"] [data-toggle-option].active'
  );
  return activeTab ? activeTab.dataset.toggleOption : 'found';
}

function renderPagination(currentPage, totalPages) {
  const container = document.getElementById('browse-pagination');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button type="button" class="pill-btn" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">Previous</button>`;

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('…');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  pages.forEach((p) => {
    if (p === '…') {
      html += `<button type="button" class="pill-btn" disabled aria-hidden="true">…</button>`;
    } else {
      const activeClass = p === currentPage ? ' active' : '';
      html += `<button type="button" class="pill-btn${activeClass}" data-page="${p}" aria-label="Page ${p}">${p}</button>`;
    }
  });

  html += `<button type="button" class="pill-btn" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">Next</button>`;

  container.innerHTML = html;
}

function renderReportedItems(selectedType = 'all') {
  const grid = document.getElementById('report-grid');
  const statusMessage = document.getElementById('browse-status');
  const countLabel = document.getElementById('browse-count');

  if (!grid || !statusMessage) return;

  if (countLabel) {
    if (totalReports === 0) {
      countLabel.textContent = '';
    } else if (totalReports > ITEMS_PER_PAGE) {
      const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
      const end = Math.min(currentPage * ITEMS_PER_PAGE, totalReports);
      countLabel.textContent = `Showing ${start}–${end} of ${totalReports} reports`;
    } else {
      countLabel.textContent = totalReports === 1
        ? '1 report'
        : `${totalReports} reports`;
    }
  }

  if (activeReports.length === 0) {
    grid.innerHTML = '';

    statusMessage.textContent = selectedType === 'all'
      ? 'No active reports are available.'
      : `No active ${selectedType} reports are available.`;

    statusMessage.classList.remove('browse-message-error');
    statusMessage.hidden = false;
    renderPagination(currentPage, 0);
    return;
  }

  grid.innerHTML = activeReports.map(reportCardHTML).join('');
  statusMessage.classList.remove('browse-message-error');
  statusMessage.hidden = true;

  renderPagination(currentPage, totalPages);
}

// Updates tab badge counts in the DOM
function updateTabBadges(counts) {
  if (!counts) return;

  const tabGroup = document.querySelector('[data-toggle-group="browse-tab"]');
  if (!tabGroup) return;

  const foundTab = tabGroup.querySelector('[data-toggle-option="found"]');
  const lostTab = tabGroup.querySelector('[data-toggle-option="lost"]');
  const allTab = tabGroup.querySelector('[data-toggle-option="all"]');

  if (foundTab && typeof counts.found === 'number') {
    foundTab.textContent = `Found (${counts.found})`;
  }
  if (lostTab && typeof counts.lost === 'number') {
    lostTab.textContent = `Lost (${counts.lost})`;
  }
  if (allTab && typeof counts.all === 'number') {
    allTab.textContent = `All (${counts.all})`;
  }
}

// Loads overall active item counts by type from GET /api/items/counts
async function loadTabCounts() {
  try {
    const res = await fetch('/api/items/counts');
    if (!res.ok) return;
    const counts = await res.json();
    updateTabBadges(counts);
  } catch (err) {
    console.error('Error loading tab counts:', err);
  }
}

// Loads reports from the API.
// Backend (server.js / MongoDB in Card #27) handles all filtering, sorting & pagination.
async function loadReportedItems(page = 1, typeOverride) {
  const grid = document.getElementById('report-grid');
  const statusMessage = document.getElementById('browse-status');
  const countLabel = document.getElementById('browse-count');

  if (!grid || !statusMessage) return;

  currentPage = page;
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
    params.append('page', currentPage);
    params.append('limit', ITEMS_PER_PAGE);

    const url = `/api/items?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`GET ${url} returned ${response.status}`);
    }

    const data = await response.json();
    const reports = Array.isArray(data)
      ? data
      : (data.items || data.reports || []);

    // Pagination metadata directly from backend
    totalReports = typeof data.total === 'number' ? data.total : reports.length;
    totalPages = typeof data.totalPages === 'number'
      ? data.totalPages
      : (Math.ceil(totalReports / ITEMS_PER_PAGE) || 1);
    currentPage = typeof data.page === 'number' ? data.page : page;

    // Reports are already active, filtered, sorted, and paginated by the backend
    activeReports = reports;

    renderReportedItems(selectedType);
  } catch (error) {
    console.error('Error loading reports:', error);
    activeReports = [];
    totalReports = 0;
    totalPages = 1;
    grid.innerHTML = '';
    if (countLabel) countLabel.textContent = '';
    statusMessage.textContent = 'Unable to load reports. Please try again.';
    statusMessage.classList.add('browse-message-error');
    statusMessage.hidden = false;
    renderPagination(1, 0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const browseTabs = document.querySelector(
    '[data-toggle-group="browse-tab"]'
  );

  if (browseTabs) {
    browseTabs.addEventListener('toggle-change', (event) => {
      loadReportedItems(1, event.detail.value);
    });
  }

  const sortSelect = document.getElementById('browse-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      loadReportedItems(1);
    });
  }

  const paginationContainer = document.getElementById('browse-pagination');
  if (paginationContainer) {
    paginationContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;

      const action = btn.dataset.page;
      if (action === 'prev') {
        if (currentPage > 1) {
          loadReportedItems(currentPage - 1);
        }
      } else if (action === 'next') {
        if (currentPage < totalPages) {
          loadReportedItems(currentPage + 1);
        }
      } else {
        const targetPage = parseInt(action, 10);
        if (targetPage && targetPage !== currentPage) {
          loadReportedItems(targetPage);
        }
      }
    });
  }

  loadTabCounts();
  loadReportedItems(1);
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHTML,
    formatReportDate,
    loadReportedItems,
    loadTabCounts,
    renderPagination,
  };
}
