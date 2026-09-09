// Minimalist Form Feedback & Accessibility Helpers

function showFormAlert(alertBox, type, message) {
    if (!alertBox) return;
    alertBox.className = `form-alert alert-${type}`;
    alertBox.setAttribute('role', type === 'error' ? 'alert' : 'status');
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
}

function clearFormAlert(alertBox) {
    if (!alertBox) return;
    alertBox.className = 'form-alert d-none';
    alertBox.textContent = '';
}

function showFieldError(input, message) {
    if (!input) return;
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');

    const errorId = `${input.id}-error`;
    input.setAttribute('aria-describedby', errorId);

    // Support Materialize select wrapper
    const wrapper = input.closest('.select-wrapper');
    if (wrapper) {
        wrapper.classList.add('is-invalid');
        const dropdown = wrapper.querySelector('input.select-dropdown');
        if (dropdown) dropdown.classList.add('is-invalid');
    }

    // Support Materialize file field
    if (input.type === 'file') {
        const fileField = input.closest('.file-field');
        const filePath = fileField?.querySelector('input.file-path');
        if (filePath) filePath.classList.add('is-invalid');
    }

    let errorElem = document.getElementById(errorId);
    if (!errorElem) {
        errorElem = document.createElement('span');
        errorElem.id = errorId;
        errorElem.className = 'field-error-msg';
        errorElem.setAttribute('role', 'alert');

        const parent = input.closest('.input-field') || input.parentElement;
        parent.appendChild(errorElem);
    }
    errorElem.textContent = message;
}

function clearFieldError(input) {
    if (!input) return;
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');

    const wrapper = input.closest('.select-wrapper');
    if (wrapper) {
        wrapper.classList.remove('is-invalid');
        const dropdown = wrapper.querySelector('input.select-dropdown');
        if (dropdown) dropdown.classList.remove('is-invalid');
    }

    if (input.type === 'file') {
        const fileField = input.closest('.file-field');
        const filePath = fileField?.querySelector('input.file-path');
        if (filePath) filePath.classList.remove('is-invalid');
    }

    const errorId = `${input.id}-error`;
    const errorElem = document.getElementById(errorId);
    if (errorElem) errorElem.remove();
}

function clearAllErrors(form, alertBox) {
    clearFormAlert(alertBox);
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('[aria-describedby]').forEach(el => el.removeAttribute('aria-describedby'));
    form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}

function scrollToFirstError(firstElement) {
    if (!firstElement) return;
    const uploadBtn = firstElement.closest('.file-field')?.querySelector('#upload-photo-btn');
    const isUploadBtnFocusable = uploadBtn && uploadBtn.hasAttribute('tabindex');
    const target = firstElement.closest('.select-wrapper')?.querySelector('input.select-dropdown')
        || (firstElement.type === 'file' ? (isUploadBtnFocusable ? uploadBtn : firstElement) : null)
        || firstElement;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') {
        target.focus();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showFormAlert,
        clearFormAlert,
        showFieldError,
        clearFieldError,
        clearAllErrors,
        scrollToFirstError
    };
}
