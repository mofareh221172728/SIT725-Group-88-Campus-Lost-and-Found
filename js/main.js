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

document.addEventListener('DOMContentLoaded', () => {
  // Repeated wireframe cards on feed screens
  document.querySelectorAll('[data-repeat]').forEach((el) => {
    el.innerHTML = cardHTML(el.dataset.repeat);
  });

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
  // Section 2.4: only two report statuses are supported — Active and Resolved.
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
});
