// public/js/browse.js
// Card #23: load and display active lost and found reports from the item API.

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

async function loadReportedItems() {
  const grid = document.getElementById('report-grid');
  const statusMessage = document.getElementById('browse-status');

  if (!grid || !statusMessage) return;

  try {
    const response = await fetch('/api/items');

    if (!response.ok) {
      throw new Error(`GET /api/items returned ${response.status}`);
    }

    const data = await response.json();
    const reports = Array.isArray(data)
      ? data
      : (data.items || data.reports || []);

    const activeReports = reports.filter((report) => (
      !report.status || String(report.status).toLowerCase() === 'active'
    ));

    if (activeReports.length === 0) {
      grid.innerHTML = '';
      statusMessage.textContent = 'No active reports are available.';
      statusMessage.classList.remove('browse-message-error');
      statusMessage.hidden = false;
      return;
    }

    grid.innerHTML = activeReports.map(reportCardHTML).join('');
    statusMessage.hidden = true;
  } catch (error) {
    console.error('Error loading reports:', error);
    grid.innerHTML = '';
    statusMessage.textContent = 'Unable to load reports. Please try again.';
    statusMessage.classList.add('browse-message-error');
    statusMessage.hidden = false;
  }
}

document.addEventListener('DOMContentLoaded', loadReportedItems);
