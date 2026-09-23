(function (root) {
  'use strict';

  const rules = typeof module !== 'undefined' && module.exports
    ? require('./report-validation') : root;
  const fieldIds = {
    title: 'item-title', category: 'item-category', date: 'item-date',
    description: 'item-desc', location: 'item-location',
    handoverMethod: 'handover-method', collectionLocation: 'collection-location'
  };

  // The page connector supplies the authenticated user and protected report.
  function prepareReport(report, currentUserId) {
    if (!currentUserId) throw new Error('Please sign in to edit your report.');
    const ownerId = report?.ownerId?._id || report?.ownerId;
    if (!ownerId || String(ownerId) !== String(currentUserId)) {
      throw new Error('You can only edit your own reports.');
    }
    if (!(report.id || report._id) || !['lost', 'found'].includes(report.type)) {
      throw new Error('Unable to load this report. Please return to My Reports.');
    }
    if (report.status !== 'active') {
      throw new Error('Only active reports can be edited.');
    }
    const type = report.type;
    const date = report.date || report[type === 'found' ? 'foundAt' : 'lostAt'] || '';
    return {
      id: String(report.id || report._id), type,
      status: 'Active',
      photos: Array.isArray(report.photos) ? report.photos.slice(0, 3) : [],
      data: {
        title: report.title || '', category: report.category || '',
        date: String(date).slice(0, 10), description: report.description || '',
        location: report.location || report.campusLocation || '',
        handoverMethod: type === 'found'
          ? (report.handoverMethod || (report.contactMethod === 'collection' ? 'dropoff' : report.contactMethod) || '') : '',
        collectionLocation: type === 'found' ? (report.collectionLocation || '') : ''
      }
    };
  }

  function validateEdits(values, type) {
    const checks = {
      title: rules.validateTitle(values.title), category: rules.validateCategory(values.category),
      date: rules.validateDate(values.date), description: rules.validateDescription(values.description),
      location: rules.validateCampus(values.location),
      handoverMethod: rules.validateHandoverMethod(values.handoverMethod, type),
      collectionLocation: rules.validateCollectionLocation(values.collectionLocation, type, values.handoverMethod)
    };
    const errors = Object.entries(checks).filter(([, result]) => !result.valid)
      .map(([field, result]) => ({ field, message: result.message }));
    const data = {};
    for (const key of Object.keys(fieldIds)) data[key] = checks[key].sanitized ?? values[key];
    data.handoverMethod = type === 'found' ? data.handoverMethod : null;
    data.collectionLocation = type === 'found' && data.handoverMethod === 'dropoff'
      ? data.collectionLocation : null;
    return { isValid: errors.length === 0, errors, data };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { prepareReport, validateEdits };
  }
  if (typeof document === 'undefined') return;
  const form = document.getElementById('edit-report-form');
  if (!form) return;
  const fields = Object.fromEntries(Object.entries(fieldIds).map(([key, id]) => [key, document.getElementById(id)]));
  const fieldset = document.getElementById('edit-fields');
  const alert = document.getElementById('form-alert');
  const saveButton = document.getElementById('save-edit');
  let report = null;
  let saveHandler = null;
  let saving = false;
  let generation = 0;

  function updateHandover() {
    const found = report?.type === 'found';
    const collection = found && fields.handoverMethod.value === 'dropoff';
    document.getElementById('edit-handover').hidden = !found;
    fields.handoverMethod.disabled = !found;
    fields.handoverMethod.required = found;
    document.getElementById('edit-collection-field').hidden = !collection;
    fields.collectionLocation.disabled = !collection;
    fields.collectionLocation.required = collection;
    if (!collection) clearFieldError(fields.collectionLocation);
  }

  function refreshMaterializeFields() {
    if (!root.M) return;
    root.M.updateTextFields?.();

    if (!root.M.FormSelect) return;
    [fields.category, fields.handoverMethod].forEach(select => {
      root.M.FormSelect.getInstance(select)?.destroy();
      root.M.FormSelect.init(select);
    });
  }

  function showReportType(type) {
    document.getElementById('edit-report-type').value = type === 'found' ? 'Found' : type === 'lost' ? 'Lost' : '';
    document.getElementById('edit-report-status').value = type ? 'Active' : '';
    document.getElementById('btn-mode-found').classList.toggle('active', type === 'found');
    document.getElementById('btn-mode-lost').classList.toggle('active', type === 'lost');
  }

  function fillFields() {
    const category = fields.category;
    category.querySelectorAll('[data-current-category]').forEach(option => option.remove());
    if (report.data.category && !Array.from(category.options).some(option => option.value === report.data.category)) {
      const option = new Option(report.data.category, report.data.category);
      option.dataset.currentCategory = 'true';
      category.add(option);
    }
    for (const [key, input] of Object.entries(fields)) input.value = report.data[key] || '';
    updateHandover();
    refreshMaterializeFields();
  }

  function showPhotos() {
    const gallery = document.getElementById('edit-photos');
    gallery.replaceChildren();
    if (!report.photos.length) gallery.textContent = 'No photos attached.';
    report.photos.forEach((photo, index) => {
      const figure = document.createElement('figure');
      const label = document.createElement('figcaption');
      label.textContent = `Photo ${index + 1}`;
      try {
        const url = new URL(photo, window.location.href);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid photo URL');
        const img = document.createElement('img');
        img.alt = `Attached photo ${index + 1}`;
        img.src = url.href;
        img.addEventListener('error', () => { img.remove(); label.textContent = 'Photo unavailable'; });
        figure.append(img);
      } catch { label.textContent = 'Photo unavailable'; }
      figure.append(label);
      gallery.append(figure);
    });
  }

  function clearReport() {
    generation += 1;
    report = null;
    saveHandler = null;
    saving = false;
    fieldset.disabled = true;
    saveButton.disabled = true;
    saveButton.textContent = 'Save changes';
    form.setAttribute('aria-busy', 'false');
    form.reset();
    fields.category.querySelectorAll('[data-current-category]').forEach(option => option.remove());
    clearAllErrors(form, alert);
    showReportType(null);
    document.getElementById('edit-photos').replaceChildren();
    updateHandover();
  }

  root.editReportForm = {
    mount({ report: source, currentUserId, onSave } = {}) {
      clearReport();
      try { report = prepareReport(source, currentUserId); }
      catch (error) { showFormAlert(alert, 'error', error.message); return false; }
      saveHandler = typeof onSave === 'function' ? onSave : null;
      showReportType(report.type);
      document.getElementById('edit-date-label').textContent = report.type === 'found' ? 'Date found *' : 'Date lost *';
      document.getElementById('edit-location-label').textContent = report.type === 'found' ? 'Found at / campus location *' : 'Last seen / campus location *';
      fillFields();
      showPhotos();
      fieldset.disabled = false;
      refreshMaterializeFields();
      saveButton.disabled = !saveHandler;
      if (!saveHandler) showFormAlert(alert, 'info', 'Saving is currently unavailable. Please try again later.');
      return true;
    },
    setLoading() { clearReport(); showFormAlert(alert, 'info', 'Loading report…'); },
    setError(message) { clearReport(); showFormAlert(alert, 'error', message || 'Unable to load this report.'); }
  };

  for (const input of Object.values(fields)) {
    const clear = () => {
      clearFieldError(input);
      if (saveHandler && !form.querySelector('.field-error-msg')) clearFormAlert(alert);
    };
    input.addEventListener('input', clear);
    input.addEventListener('change', clear);
  }
  fields.handoverMethod.addEventListener('change', updateHandover);
  document.getElementById('reset-edit').addEventListener('click', () => {
    if (!report || saving) return;
    clearAllErrors(form, alert);
    fillFields();
    if (!saveHandler) showFormAlert(alert, 'info', 'Saving is currently unavailable. Please try again later.');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!report || !saveHandler || saving) return;
    clearAllErrors(form, alert);
    const values = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value]));
    const validation = validateEdits(values, report.type);
    if (!validation.isValid) {
      validation.errors.forEach(error => showFieldError(fields[error.field], error.message));
      showFormAlert(alert, 'error', 'Please fix the highlighted fields.');
      scrollToFirstError(fields[validation.errors[0].field]);
      return;
    }
    const currentGeneration = generation;
    saving = true;
    fieldset.disabled = true;
    saveButton.textContent = 'Saving…';
    form.setAttribute('aria-busy', 'true');
    try {
      const result = await saveHandler({ id: report.id, type: report.type, changes: validation.data });
      if (currentGeneration !== generation) return;
      if (result?.saved === true) {
        report.data = { ...validation.data };
        fillFields();
        showFormAlert(alert, 'success', result.message || 'Your report has been updated.');
      } else {
        showFormAlert(alert, 'info', result?.message || 'Your changes have not been saved. Please try again.');
      }
    } catch (error) {
      if (currentGeneration !== generation) return;
      showFormAlert(alert, 'error', error.message || 'Unable to save your changes. Please try again.');
    } finally {
      if (currentGeneration === generation) {
        saving = false;
        fieldset.disabled = false;
        refreshMaterializeFields();
        saveButton.textContent = 'Save changes';
        form.setAttribute('aria-busy', 'false');
        alert.focus();
      }
    }
  });
})(typeof window === 'undefined' ? globalThis : window);
