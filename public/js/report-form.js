document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('report-item-form');
    const btnLost = document.getElementById('btn-mode-lost');
    const btnFound = document.getElementById('btn-mode-found');
    const typeInput = document.getElementById('report-type');
    const dateLabel = document.getElementById('date-label');
    const locationHeading = document.getElementById('location-heading');
    const foundCollectionSection = document.getElementById('section-found-collection');
    const alertBox = document.getElementById('form-alert');
    const dateInput = document.getElementById('item-date');

    // Toggle between Lost and Found mode
    function setReportMode(mode) {
        const isLost = mode === 'lost';
        typeInput.value = mode;
        btnLost.classList.toggle('active', isLost);
        btnLost.setAttribute('aria-checked', isLost ? 'true' : 'false');
        btnFound.classList.toggle('active', !isLost);
        btnFound.setAttribute('aria-checked', !isLost ? 'true' : 'false');

        dateLabel.textContent = isLost ? 'Date Lost' : 'Date Found';
        locationHeading.textContent = isLost ? 'Last-Seen Location' : 'Discovery Location';
        foundCollectionSection.classList.toggle('d-none', isLost);
    }

    if (btnLost && btnFound) {
        btnLost.addEventListener('click', () => setReportMode('lost'));
        btnFound.addEventListener('click', () => setReportMode('found'));
    }

    // Default to today's date
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (!form) return;

    // Real-time error clearing when user fixes input
    form.querySelectorAll('input, select, textarea').forEach(input => {
        const clear = () => {
            if (input.classList.contains('is-invalid')) {
                clearFieldError(input);
                if (!form.querySelector('.field-error-msg')) {
                    clearFormAlert(alertBox);
                }
            }
        };
        input.addEventListener('input', clear);
        input.addEventListener('change', clear);
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAllErrors(form, alertBox);

        // Validation
        if (typeof validateReportForm === 'function') {
            const validation = validateReportForm(form);
            if (!validation.isValid) {
                showFormAlert(alertBox, 'error', 'Please fix the highlighted errors before submitting.');
                validation.errors.forEach(err => showFieldError(err.element, err.message));
                scrollToFirstError(validation.errors[0].element);
                return;
            }
        }

        // Collect handover method only if it is a found report
        const isFound = typeInput.value === 'found';
        const handoverInput = document.querySelector('input[name="handoverMethod"]:checked');

        // Collect all form fields using validated and sanitized normal text
        const data = validation?.data || {};
        const reportData = {
            type: typeInput.value,
            title: data.title,
            category: data.category,
            date: data.date,
            description: data.description,
            campus: data.campus,
            building: data.building,
            room: data.room,
            handoverMethod: isFound ? (handoverInput?.value || null) : null
        };

        console.log('Report submitted:', reportData);

        // Success UI feedback
        showFormAlert(alertBox, 'success', `Report submitted successfully! Your ${typeInput.value} item has been added.`);
        form.reset();

        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        if (typeof M !== 'undefined' && M.updateTextFields) {
            M.updateTextFields();
        }

        alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});