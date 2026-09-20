function formatItemDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date not provided';

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function setItemText(id, value, fallback = 'Not provided') {
  document.getElementById(id).textContent = value || fallback;
}

function showNoPhoto(container) {
  const fallback = document.createElement('div');
  fallback.className = 'ph item-photo-fallback';
  fallback.textContent = 'No photo available';
  container.dataset.count = '1';
  container.replaceChildren(fallback);
}

function renderItemPhotos(photos, title) {
  const container = document.getElementById('item-photos');
  const availablePhotos = Array.isArray(photos)
    ? photos.filter(Boolean).slice(0, 3)
    : [];

  if (availablePhotos.length === 0) {
    showNoPhoto(container);
    return;
  }

  const images = availablePhotos.map((photo, index) => {
    const image = document.createElement('img');
    image.className = 'item-detail-photo';
    image.src = photo;
    image.alt = `${title || 'Reported item'} photo ${index + 1}`;
    image.addEventListener('error', () => {
      image.remove();
      const remainingPhotos = container.querySelectorAll('img').length;
      if (remainingPhotos === 0) {
        showNoPhoto(container);
      } else {
        container.dataset.count = String(remainingPhotos);
      }
    });
    return image;
  });

  container.dataset.count = String(images.length);
  container.replaceChildren(...images);
}

function renderFoundContact(report) {
  const panel = document.getElementById('item-contact');
  const heading = document.getElementById('item-contact-heading');
  const copy = document.getElementById('item-contact-copy');

  if (report.type !== 'found') {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;

  if (report.contactMethod === 'collection') {
    heading.textContent = 'Collection information';
    copy.textContent = report.collectionLocation
      ? `Collect this item from ${report.collectionLocation}.`
      : 'Collection location not provided.';
    return;
  }

  heading.textContent = 'Contact information';
  copy.replaceChildren();

  if (!report.contactEmail) {
    copy.textContent = 'Reporter contact information is not available.';
    return;
  }

  const link = document.createElement('a');
  link.className = 'btn-wf-strong item-contact-action';
  link.href = `mailto:${report.contactEmail}`;
  link.textContent = 'Contact reporter →';
  copy.append(link);
}

function renderItemDetail(report) {
  const type = report.type === 'lost' ? 'lost' : 'found';
  const status = String(report.status || 'active');
  const statusBadge = document.getElementById('item-status');

  setItemText('item-type', type === 'lost' ? 'Lost' : 'Found');
  setItemText('item-status', status);
  setItemText('item-title', report.title, 'Untitled item');
  setItemText('item-description', report.description);
  setItemText('item-category', report.category);
  setItemText('item-location', report.location);
  setItemText('item-date', formatItemDate(report.date));
  setItemText('item-reported-date', formatItemDate(report.reportedDate));

  document.getElementById('item-date-label').textContent =
    type === 'lost' ? 'Date lost' : 'Date found';
  statusBadge.classList.toggle('badge-resolved', status.toLowerCase() === 'resolved');
  statusBadge.classList.toggle('badge-active', status.toLowerCase() !== 'resolved');

  renderItemPhotos(report.photos, report.title);
  renderFoundContact(report);
}

async function loadItemDetail() {
  const message = document.getElementById('item-detail-message');
  const content = document.getElementById('item-detail-content');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const type = params.get('type');

  if (!id || !['found', 'lost'].includes(type)) {
    message.textContent = 'No valid report was selected.';
    return;
  }

  try {
    const data = await api.get(
      `/api/items/${encodeURIComponent(id)}?type=${encodeURIComponent(type)}`,
    );
    renderItemDetail(data.report);
    content.hidden = false;
    message.hidden = true;
  } catch (error) {
    message.textContent = error.status === 404
      ? 'This report could not be found.'
      : 'Unable to load this report. Please try again.';
    message.classList.toggle('browse-message-error', error.status !== 404);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', loadItemDetail);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatItemDate };
}
