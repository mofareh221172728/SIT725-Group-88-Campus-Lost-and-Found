// public/js/main.js
// Real button interactivity for the wireframes: tab switching, toggles,
// filter feedback, and resolve/delete actions on My Reports.

function cardHTML() {
  return `
    <div class="card-wf">
      <div class="ph mb-2" style="height:110px; border-radius:3px;">photo</div>
      <div class="d-flex justify-content-between align-items-start">
        <div class="lorem-line w-60" style="margin:0;"></div>
        <span class="badge-wf badge-active" style="font-size:.58rem;">Active</span>
      </div>
      <div class="lorem-line w-40" style="height:6px;"></div>
      <div class="mono" style="font-size:.62rem; color:#9a9a95; margin-top:4px;">Bldg LC · 2 days ago</div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Repeated wireframe cards on feed screens
  document.querySelectorAll('[data-repeat]').forEach((el) => {
    el.innerHTML = cardHTML();
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

  // --- Create Report: submit form to POST /api/items ---
const reportForm = document.getElementById('report-form');

if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const activeTypeBtn = document.querySelector(
      '[data-toggle-group="report-type"] [data-toggle-option].active'
    );

    const type = activeTypeBtn ? activeTypeBtn.dataset.toggleOption : 'found';

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
  document.querySelectorAll('[data-action="resolve-report"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.report-row');
      if (!row) return;
      const label = row.dataset.resolvedLabel || 'Resolved';
      const badge = row.querySelector('.status-badge');
      if (badge) {
        badge.textContent = label;
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
