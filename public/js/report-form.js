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

    const collectionLocationField = document.getElementById('collection-location-field');
    const collectionLocationInput = document.getElementById('collection-location');
    const handoverInputs = document.querySelectorAll('input[name="handoverMethod"]');
    const submitButton = document.getElementById('btn-submit-report');

    function updateFoundFields() {
    const isFound = typeInput.value === 'found';
    const handoverMethod = document.querySelector('input[name="handoverMethod"]:checked')?.value;
    const needsCollectionLocation = isFound && handoverMethod === 'dropoff';

    foundCollectionSection.classList.toggle('d-none', !isFound);



    handoverInputs.forEach(input => {
        input.disabled = !isFound;
        input.required = isFound;
        input.setAttribute('aria-required', String(isFound));
    });

    collectionLocationField.classList.toggle('d-none', !needsCollectionLocation);
    collectionLocationInput.disabled = !needsCollectionLocation;
    collectionLocationInput.required = needsCollectionLocation;
    collectionLocationInput.setAttribute('aria-required', String(needsCollectionLocation));

    if (!needsCollectionLocation && typeof clearFieldError === 'function') {
        clearFieldError(collectionLocationInput);
    }
}

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
        updateFoundFields();
    }

    if (btnLost && btnFound) {
        btnLost.addEventListener('click', () => setReportMode('lost'));
        btnFound.addEventListener('click', () => setReportMode('found'));
    }
     handoverInputs.forEach(input => {
    input.addEventListener('change', () => {
        handoverInputs.forEach(clearFieldError);
        updateFoundFields();
     });
    });

updateFoundFields();
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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors(form, alertBox);

        // Validation
        let validation = null;
        if (typeof validateReportForm === 'function') {
            validation = validateReportForm(form);
            if (!validation.isValid) {
                showFormAlert(alertBox, 'error', 'Please fix the highlighted errors before submitting.');
                validation.errors.forEach(err => showFieldError(err.element, err.message));
                scrollToFirstError(validation.errors[0].element);
                return;
            }
        }

        // Collect handover method only if it is a found report
        const isFound = typeInput.value === 'found';


        // Collect all form fields using validated and sanitized normal text
        const data = validation?.data || {};
        const location = [data.campus, data.building, data.room].filter(Boolean).join(', ');
        const reportData = {
            type: typeInput.value,
            title: data.title,
            category: data.category,
            date: data.date,
            location: location,
            description: data.description,
            campus: data.campus,
            building: data.building,
            room: data.room,
            handoverMethod: isFound ? data.handoverMethod : null,
            collectionLocation: isFound ? data.collectionLocation : null
        };

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const result = await api.post('/api/items', reportData);

            // Success UI feedback
            const submittedType = typeInput.value;
            showFormAlert(alertBox, 'success', result.message || `Report submitted successfully! Your ${submittedType} item has been added.`);
            form.reset();
            setReportMode('found');

            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            if (typeof M !== 'undefined' && M.updateTextFields) {
                M.updateTextFields();
            }

            alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (error) {
            console.error('Error submitting report:', error);
            showFormAlert(alertBox, 'error', error.message || 'Unable to submit report. Please check your connection and try again.');
            alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
});