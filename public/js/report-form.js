document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('report-item-form');
    const btnLost = document.getElementById('btn-mode-lost');
    const btnFound = document.getElementById('btn-mode-found');
    const typeInput = document.getElementById('report-type');

    const dateLabel = document.getElementById('date-label');
    const locationHeading = document.getElementById('location-heading');
    const foundCollectionSection = document.getElementById('section-found-collection');

    // Mode function to change between Lost and Found tabs
    function setReportMode(mode) {
        if (window.formFeedback && form) {
            window.formFeedback.clearAllErrors(form);
        }

        if (mode === 'lost') {
            typeInput.value = 'lost';
            btnLost.classList.add('active');
            btnLost.setAttribute('aria-checked', 'true');
            btnFound.classList.remove('active');
            btnFound.setAttribute('aria-checked', 'false');

            dateLabel.textContent = 'Date Lost';
            locationHeading.textContent = 'Last-Seen Location';
            foundCollectionSection.classList.add('d-none');

        } else {
            typeInput.value = 'found';
            btnFound.classList.add('active');
            btnFound.setAttribute('aria-checked', 'true');
            btnLost.classList.remove('active');
            btnLost.setAttribute('aria-checked', 'false');

            dateLabel.textContent = 'Date Found';
            locationHeading.textContent = 'Discovery Location';
            foundCollectionSection.classList.remove('d-none');
        }
    }

    btnLost.addEventListener('click', () => setReportMode('lost'));
    btnFound.addEventListener('click', () => setReportMode('found'));

    // Set default today's date in date picker
    const dateInput = document.getElementById('item-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // function to execute on report submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate form
            let validation = null;
            if (typeof validateReportForm === 'function') {
                validation = validateReportForm(form);
                if (!validation.isValid) {
                    if (window.formFeedback && typeof window.formFeedback.showFormErrors === 'function') {
                        window.formFeedback.showFormErrors(form, validation.errors);
                    } else {
                        alert(`Please fix the error(s) before submitting: \n${validation.errors.map(err => err.message).join('\n')}`);
                    }
                    return;
                }
            }

            // Collect all form fields
            const data = validation?.data || {};
            const reportData = {
                type: typeInput.value,
                title: data.title ?? document.getElementById('item-title').value.trim(),
                category: data.category ?? document.getElementById('item-category').value,
                date: document.getElementById('item-date').value,
                description: data.description ?? document.getElementById('item-desc').value.trim(),
                campus: data.campus ?? document.getElementById('item-campus').value,
                building: data.building ?? document.getElementById('item-building').value.trim(),
                room: document.getElementById('item-room').value.trim(),
                handoverMethod: document.querySelector('input[name="handoverMethod"]:checked')?.value || null
            };

            console.log('Report submission data:', reportData);

            // Reset form and re-initialize Materialize select dropdowns
            form.reset();
            if (window.M && typeof M.FormSelect !== 'undefined') {
                M.FormSelect.init(form.querySelectorAll('select'));
            }

            // Success feedback replacing browser alert
            if (window.formFeedback && typeof window.formFeedback.showSuccessFeedback === 'function') {
                window.formFeedback.showSuccessFeedback(form, 'Report submitted successfully! Thank you for helping our campus community.');
            } else {
                alert('Report submitted successfully!');
            }

            // Re-initialize default date after reset
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        });
    }
});