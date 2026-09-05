document.addEventListener('DOMContentLoaded', () => {
    const btnLost = document.getElementById('btn-mode-lost');
    const btnFound = document.getElementById('btn-mode-found');
    const typeInput = document.getElementById('report-type');

    const dateLabel = document.getElementById('date-label');
    const locationHeading = document.getElementById('location-heading');
    const foundCollectionSection = document.getElementById('section-found-collection');
    const finderEmailInput = document.getElementById('finder-email');

    // Mode function to change between Lost and Found tabs
    function setReportMode(mode) {
        if (mode === 'lost') {
            typeInput.value = 'lost';
            btnLost.classList.add('active');
            btnLost.setAttribute('aria-checked', 'true');
            btnFound.classList.remove('active');
            btnFound.setAttribute('aria-checked', 'false');

            dateLabel.textContent = 'Date Lost';
            locationHeading.textContent = 'Last-Seen Location';
            foundCollectionSection.classList.add('d-none');
            finderEmailInput.required = false;

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
});