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

let modalPhotos = [];
let currentPhotoIndex = 0;

function openPhotoModal(photos, index = 0) {
  modalPhotos = Array.isArray(photos) ? photos : [];
  currentPhotoIndex = index >= 0 ? index : 0;

  const modal = document.getElementById('photo-modal');
  const modalImg = document.getElementById('photo-modal-img');
  const prevBtn = document.getElementById('photo-modal-prev');
  const nextBtn = document.getElementById('photo-modal-next');

  if (!modal || !modalImg) return;

  modalImg.src = modalPhotos[currentPhotoIndex] || '';

  const hasMultiple = modalPhotos.length > 1;
  if (prevBtn) prevBtn.hidden = !hasMultiple;
  if (nextBtn) nextBtn.hidden = !hasMultiple;

  modal.classList.add('is-open');
}

function closePhotoModal() {
  const modal = document.getElementById('photo-modal');
  if (modal) modal.classList.remove('is-open');
}

function initPhotoModal() {
  const modal = document.getElementById('photo-modal');
  const modalImg = document.getElementById('photo-modal-img');
  const prevBtn = document.getElementById('photo-modal-prev');
  const nextBtn = document.getElementById('photo-modal-next');

  if (!modal || !modalImg) return;

  if (prevBtn) {
    prevBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      currentPhotoIndex = (currentPhotoIndex - 1 + modalPhotos.length) % modalPhotos.length;
      modalImg.src = modalPhotos[currentPhotoIndex];
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      currentPhotoIndex = (currentPhotoIndex + 1) % modalPhotos.length;
      modalImg.src = modalPhotos[currentPhotoIndex];
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.id === 'photo-modal-close') {
      closePhotoModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closePhotoModal();
    }
  });
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

    image.addEventListener('click', () => {
      const activeUrls = Array.from(container.querySelectorAll('.item-detail-photo')).map((img) => img.src);
      openPhotoModal(activeUrls, activeUrls.indexOf(image.src));
    });

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

let currentReport = null;
let isFavourite = false;

function updateFavouriteButton() {
  const button = document.getElementById('favourite-toggle');
  if (!button) return;

  button.hidden = false;
  button.setAttribute('aria-pressed', String(isFavourite));
  button.textContent = isFavourite
    ? '♥ Remove from favourites'
    : '♡ Save to favourites';
}

async function loadFavouriteState(report) {
  const button = document.getElementById('favourite-toggle');
  if (!button || !report) return;

  currentReport = report;

  try {
    const data = await api.get('/api/favourites');
    const favourites = Array.isArray(data) ? data : (data.favourites || []);

    isFavourite = favourites.some((favourite) => {
      const itemId = favourite.itemId?._id || favourite.itemId;
      return String(itemId) === String(report.id || report._id);
    });

    updateFavouriteButton();
  } catch (error) {
    // User may not be logged in, so keep the control hidden.
    button.hidden = true;
  }
}

async function toggleFavourite() {
  const button = document.getElementById('favourite-toggle');
  const message = document.getElementById('favourite-message');

  if (!button || !currentReport) return;

  const itemId = currentReport.id || currentReport._id;
  const type = currentReport.type;

  button.disabled = true;

  try {
    if (isFavourite) {
      await api.delete(
         `/api/favourites/${encodeURIComponent(type)}/${encodeURIComponent(itemId)}`,
      );
      isFavourite = false;

      if (message) {
        message.textContent = 'Removed from favourites.';
        message.hidden = false;
      }
    } else {
      await api.post('/api/favourites', {
        itemId,
        itemType: type,
      });

      isFavourite = true;

      if (message) {
        message.textContent = 'Saved to favourites.';
        message.hidden = false;
      }
    }

    updateFavouriteButton();
  } catch (error) {
    if (message) {
      message.textContent = error.message || 'Unable to update favourites.';
      message.hidden = false;
    }
  } finally {
    button.disabled = false;
  }
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
  loadFavouriteState(report);
}

const campuses = ['Burwood', 'Waurn Ponds', 'Waterfront', 'Warrnambool'];

function extractCampus(location) {
  const firstPart = String(location || '').split(',')[0].trim();
  return campuses.find((c) => firstPart.toLowerCase().includes(c.toLowerCase())) || firstPart;
}

async function loadPotentialMatches(report) {
  const section = document.getElementById('potential-matches');
  const grid = document.getElementById('potential-matches-grid');
  const message = document.getElementById('potential-matches-message');

  if (!section || !grid || !message || !report) return;

  section.hidden = false;

  const oppositeType = report.type === 'lost' ? 'found' : 'lost';
  const params = new URLSearchParams({ type: oppositeType });
  if (report.category) params.set('category', report.category);

  const campus = extractCampus(report.campus || report.location);
  if (campus) params.set('location', campus);

  try {
    const data = await api.get(`/api/items?${params}`);
    const results = Array.isArray(data) ? data : (data.items || []);
    const matches = results
      .filter((item) => (item.status || 'active').toLowerCase() === 'active')
      .slice(0, 3);

    if (matches.length === 0) {
      grid.innerHTML = '';
      message.textContent = 'No potential matches found in the system right now.';
      message.hidden = false;
      return;
    }

    message.hidden = true;
    grid.innerHTML = matches.map(reportCardHTML).join('');
  } catch (error) {
    grid.innerHTML = '';
    message.textContent = 'No potential matches found in the system right now.';
    message.hidden = false;
  }
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
    loadPotentialMatches(data.report);
  } catch (error) {
    message.textContent = error.status === 404
      ? 'This report could not be found.'
      : 'Unable to load this report. Please try again.';
    message.classList.toggle('browse-message-error', error.status !== 404);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
  initPhotoModal();

  const favouriteButton = document.getElementById('favourite-toggle');

  if (favouriteButton) {
    favouriteButton.addEventListener('click', toggleFavourite);
  }

  loadItemDetail();
 });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatItemDate,
    openPhotoModal,
    closePhotoModal,
    loadPotentialMatches,
    extractCampus,
    loadFavouriteState,
    toggleFavourite,
    updateFavouriteButton,
  };
}

