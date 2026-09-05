const TITLE_MIN_LEN = 5;
const TITLE_MAX_LEN = 100;
const DESC_MIN_LEN = 10;
const DESC_MAX_LEN = 1000;

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// --- Sanitization Helper ---
function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// --- Individual Field Validators ---

function validateTitle(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) {
        return { valid: false, message: 'Item title is required.' };
    }
    if (trimmed.length < TITLE_MIN_LEN) {
        return { valid: false, message: `Title must be at least ${TITLE_MIN_LEN} characters long.` };
    }
    if (trimmed.length > TITLE_MAX_LEN) {
        return { valid: false, message: `Title cannot exceed ${TITLE_MAX_LEN} characters.` };
    }
    return { valid: true, sanitized: sanitizeText(trimmed) };
}

function validateCategory(value) {
    if (!value || value.trim() === '') {
        return { valid: false, message: 'Please select a category for the item.' };
    }
    return { valid: true, sanitized: sanitizeText(value) };
}

function validateCampus(value) {
    if (!value || value.trim() === '') {
        return { valid: false, message: 'Please select the relevant campus location.' };
    }
    return { valid: true, sanitized: sanitizeText(value) };
}

function validateBuilding(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) {
        return { valid: false, message: 'Building location is required (e.g. Building B).' };
    }
    return { valid: true, sanitized: sanitizeText(trimmed) };
}

function validateDate(value) {
    if (!value) {
        return { valid: false, message: 'Please select the relevant date.' };
    }
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
        return { valid: false, message: 'Date cannot be in the future.' };
    }
    return { valid: true };
}

function validateDescription(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) {
        return { valid: false, message: 'Description cannot be empty or whitespace.' };
    }
    if (trimmed.length < DESC_MIN_LEN) {
        return { valid: false, message: `Description must be at least ${DESC_MIN_LEN} characters long.` };
    }
    if (trimmed.length > DESC_MAX_LEN) {
        return { valid: false, message: `Description cannot exceed ${DESC_MAX_LEN} characters.` };
    }
    return { valid: true, sanitized: sanitizeText(trimmed) };
}

function validatePhotos(fileList) {
    if (!fileList || fileList.length === 0) {
        return { valid: true }; // Photos are optional in MVP
    }
    if (fileList.length > MAX_PHOTOS) {
        return { valid: false, message: `You can upload a maximum of ${MAX_PHOTOS} photos.` };
    }

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return { valid: false, message: `File "${file.name}" is not supported. Use JPG, PNG, or WEBP.` };
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return { valid: false, message: `File "${file.name}" exceeds the 5MB size limit.` };
        }
    }
    return { valid: true };
}

// --- Main Form Orchestration ---

function validateReportForm(formElement) {
    const errors = [];

    // 1. Title
    const titleInput = formElement.querySelector('#item-title');
    const titleRes = validateTitle(titleInput?.value);
    if (!titleRes.valid) errors.push({ element: titleInput, message: titleRes.message });

    // 2. Category
    const categorySelect = formElement.querySelector('#item-category');
    const catRes = validateCategory(categorySelect?.value);
    if (!catRes.valid) errors.push({ element: categorySelect, message: catRes.message });

    // 3. Date
    const dateInput = formElement.querySelector('#item-date');
    const dateRes = validateDate(dateInput?.value);
    if (!dateRes.valid) errors.push({ element: dateInput, message: dateRes.message });

    // 4. Campus
    const campusSelect = formElement.querySelector('#item-campus');
    const campusRes = validateCampus(campusSelect?.value);
    if (!campusRes.valid) errors.push({ element: campusSelect, message: campusRes.message });

    // 5. Building
    const buildingInput = formElement.querySelector('#item-building');
    const buildingRes = validateBuilding(buildingInput?.value);
    if (!buildingRes.valid) errors.push({ element: buildingInput, message: buildingRes.message });

    // 6. Description
    const descInput = formElement.querySelector('#item-desc');
    const descRes = validateDescription(descInput?.value);
    if (!descRes.valid) errors.push({ element: descInput, message: descRes.message });

    // 7. Photos
    const photoInput = formElement.querySelector('#item-photos');
    const photoRes = validatePhotos(photoInput?.files);
    if (!photoRes.valid) errors.push({ element: photoInput, message: photoRes.message });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}


window.validateReportForm = validateReportForm;