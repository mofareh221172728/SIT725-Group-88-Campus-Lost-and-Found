(function () {
  'use strict';

  const itemsContainer = document.getElementById('reported-items');
  const itemsFeedback = document.getElementById('items-feedback');

  if (!itemsContainer || !itemsFeedback) {
    return;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  }

  function formatDate(value) {
    if (!value) {
      return 'Date not provided';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString('en-AU');
  }

  function itemCardHtml(item) {
    const reportType = item.type
      ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
      : 'Unknown';
    const title = item.title || 'Untitled item';
    const category = item.category || 'Uncategorised';
    const location = item.location || 'Location not provided';
    const date = formatDate(item.date);
    const status = item.status || 'Active';
    const statusClass = status.toLowerCase() === 'resolved'
      ? 'badge-resolved'
      : 'badge-active';
    const itemId = encodeURIComponent(item.id ?? '');

    return '<a href="item-detail.html?id=' + itemId + '" class="no-underline">' +
      '<div class="card-wf">' +
        '<div class="ph mb-2" style="height:110px; border-radius:3px;">No photo</div>' +
        '<div class="flex justify-between items-center mb-1">' +
          '<span class="badge-wf" style="font-size:.58rem;">' +
            escapeHtml(reportType) +
          '</span>' +
          '<span class="badge-wf ' + statusClass + '" style="font-size:.58rem;">' +
            escapeHtml(status) +
          '</span>' +
        '</div>' +
        '<h3 style="font-size:.9rem; margin:0 0 4px;">' +
          escapeHtml(title) +
        '</h3>' +
        '<div class="mono" style="font-size:.62rem; color:#9a9a95;">' +
          escapeHtml(category) + ' · ' +
          escapeHtml(location) + ' · ' +
          escapeHtml(date) +
        '</div>' +
      '</div>' +
    '</a>';
  }

  function showMessage(message) {
    itemsContainer.innerHTML = '';
    itemsFeedback.textContent = message;
    itemsFeedback.hidden = false;
  }

  function renderItems(items) {
    if (items.length === 0) {
      showMessage('No reported items are available.');
      return;
    }

    itemsFeedback.hidden = true;
    itemsContainer.innerHTML = items.map(itemCardHtml).join('');
  }

  async function loadItems() {
    showMessage('Loading reported items...');

    try {
      const response = await fetch('/api/items');

      if (!response.ok) {
        throw new Error('GET /api/items returned ' + response.status);
      }

      const items = await response.json();

      if (!Array.isArray(items)) {
        throw new Error('GET /api/items did not return an array.');
      }

      renderItems(items);
    } catch (error) {
      console.error('Unable to load reported items:', error);
      showMessage('Unable to load reported items. Please try again.');
    }
  }

  loadItems();
})();
