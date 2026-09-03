// public/js/main.js
// Real button interactivity for the wireframes: tab switching, toggles,
// filter feedback, and resolve/delete actions on My Reports.

// FR-VR-01: each card must show item title, report type, category,
// campus location, date reported, and primary photo.
function cardHTML(type) {
  const reportType = type === 'lost' ? 'Lost' : 'Found';
  return `
    <div class="card-wf">
      <div class="ph mb-2" style="height:110px; border-radius:3px;">photo</div>
      <div class="flex justify-between items-center mb-1">
        <span class="badge-wf" style="font-size:.58rem;">${reportType}</span>
        <span class="badge-wf badge-active" style="font-size:.58rem;">Active</span>
      </div>
      <div class="lorem-line w-60" style="margin:0 0 4px;"></div>
      <div class="mono" style="font-size:.62rem; color:#9a9a95;">Electronics · Bldg LC · 2 days ago</div>
    </div>`;
}


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

document.addEventListener('DOMContentLoaded', () => {
  // Repeated wireframe cards on feed screens
  document.querySelectorAll('[data-repeat]').forEach((el) => {
    el.innerHTML = cardHTML(el.dataset.repeat);
  });

  // Load live report data on the Main Browse page.
  loadReportedItems();

  // --- Generic exclusive toggle group (tabs, Lost/Found toggle, filter chips) ---
  document.querySelectorAll('[data-toggle-group]').forEach((group) => {
    const buttons = group.querySelectorAll('[data-toggle-option]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        group.dispatchEvent(
          new CustomEvent('toggle-change', {
            detail: { group: group.dataset.toggleGroup, value: btn.dataset.toggleOption },
          })
        );
      });
    });
  });

  // --- Create Report: swap Lost / Found field panels on toggle ---
const reportToggle = document.querySelector('[data-toggle-group="report-type"]');

if (reportToggle) {
  reportToggle.addEventListener('toggle-change', (e) => {
    const lostPanel = document.getElementById('panel-lost');
    const foundPanel = document.getElementById('panel-found');

    if (!lostPanel || !foundPanel) return;

    const showLost = e.detail.value === 'lost';

    lostPanel.classList.toggle('d-none', !showLost);
    foundPanel.classList.toggle('d-none', showLost);

    const lostFields = lostPanel.querySelectorAll('input, select, textarea');
    const foundFields = foundPanel.querySelectorAll('input, select, textarea');

    lostFields.forEach((field) => {
      field.required = showLost;
    });

    foundFields.forEach((field) => {
      field.required = !showLost;
    });
  });
}

  // --- Search & Filter: Apply / Clear feedback ---
  const applyBtn = document.querySelector('[data-action="apply-filters"]');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      applyBtn.textContent = 'Applied ✓';
      setTimeout(() => { applyBtn.textContent = 'Apply filters'; }, 1200);
    });
  }
  const clearBtn = document.querySelector('[data-action="clear-filters"]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.select-wf, .select-wf-inline').forEach((s) => (s.selectedIndex = 0));
      document.querySelectorAll('.input-wf-real').forEach((i) => (i.value = ''));
      const typeGroup = document.querySelector('[data-toggle-group="filter-type"]');
      if (typeGroup) {
        const opts = typeGroup.querySelectorAll('[data-toggle-option]');
        opts.forEach((b) => b.classList.remove('active'));
        const allBtn = typeGroup.querySelector('[data-toggle-option="all"]');
        if (allBtn) allBtn.classList.add('active');
      }
    });
  }

  // --- My Reports: Resolve marks a report resolved; Delete removes the row ---
  // Section 2.4: only two report statuses are supported - Active and Resolved.
  document.querySelectorAll('[data-action="resolve-report"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.report-row');
      if (!row) return;
      const badge = row.querySelector('.status-badge');
      if (badge) {
        badge.textContent = 'Resolved';
        badge.classList.remove('badge-active');
        badge.classList.add('badge-resolved');
      }
      row.querySelectorAll('[data-action="edit-report"], [data-action="resolve-report"]').forEach((b) => {
        b.disabled = true;
      });
    });
  });

  document.querySelectorAll('[data-action="delete-report"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.report-row');
      if (row && confirm('Delete this report? (wireframe placeholder  no data is actually stored yet)')) {
        row.remove();
      }
    });
  });

// --- Create Report: submit form to item API ---
const reportForm = document.getElementById('report-form');

if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const activeTypeBtn = document.querySelector(
      '[data-toggle-group="report-type"] [data-toggle-option].active'
    );

    const type = activeTypeBtn
      ? activeTypeBtn.dataset.toggleOption
      : 'found';

    let reportData;

    if (type === 'found') {
      reportData = {
        type: 'found',
        title: document.getElementById('f-title').value.trim(),
        category: document.getElementById('f-category').value,
        date: document.getElementById('f-date').value,
        location: document.getElementById('f-location').value.trim(),
        description: document.getElementById('f-desc').value.trim()
      };
    } else {
      reportData = {
        type: 'lost',
        title: document.getElementById('l-title').value.trim(),
        category: document.getElementById('l-category').value,
        date: document.getElementById('l-date').value,
        location: document.getElementById('l-lastseen').value.trim(),
        description: document.getElementById('l-desc').value.trim()
      };
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Unable to submit report.');
        return;
      }

      alert('Report submitted successfully.');
      reportForm.reset();

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Something went wrong. Please try again.');
    }
  });
}

});
