// public/js/form-feedback.js
// Accessible form error states, shake animations, real-time clearing, auto-focus scrolling, and feedback banners

(function () {
    /**
     * Resolve the visible interactive element and target container,
     * accommodating Materialize CSS selects and file inputs.
     */
    function resolveElementContext(element) {
        if (!element) return { inputEl: null, containerEl: null, visibleEl: null };

        const selectWrapper = element.closest('.select-wrapper');
        const fileField = element.closest('.file-field');
        const inputField = element.closest('.input-field') || fileField || element.parentNode;

        let visibleEl = element;
        if (element.tagName === 'SELECT' && selectWrapper) {
            visibleEl = selectWrapper.querySelector('input.select-dropdown') || element;
        } else if (element.type === 'file' && fileField) {
            visibleEl = fileField.querySelector('input.file-path') || element;
        }

        return {
            inputEl: element,
            containerEl: inputField,
            visibleEl: visibleEl,
            selectWrapper: selectWrapper,
            fileField: fileField
        };
    }

    // 1. Show Inline Error on a specific input element
    function showFieldError(element, message) {
        if (!element) return;

        clearFieldError(element);

        const ctx = resolveElementContext(element);

        // Add error highlighting & shake animation to visible and base elements
        element.classList.add('has-error', 'shake-element');
        element.setAttribute('aria-invalid', 'true');

        if (ctx.visibleEl && ctx.visibleEl !== element) {
            ctx.visibleEl.classList.add('has-error', 'shake-element');
            ctx.visibleEl.setAttribute('aria-invalid', 'true');
        }
        if (ctx.selectWrapper) {
            ctx.selectWrapper.classList.add('has-error');
        }

        // Remove shake class after animation completes so it can re-trigger on subsequent attempts
        setTimeout(() => {
            element.classList.remove('shake-element');
            if (ctx.visibleEl) ctx.visibleEl.classList.remove('shake-element');
        }, 400);

        // Accessible IDs
        const errorId = `${element.id || 'field'}-error-msg`;
        element.setAttribute('aria-describedby', errorId);
        if (ctx.visibleEl && ctx.visibleEl !== element) {
            ctx.visibleEl.setAttribute('aria-describedby', errorId);
        }

        // Create accessible inline error message
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.id = errorId;
        errorSpan.setAttribute('role', 'alert');
        errorSpan.textContent = message;

        // Append to container (input-field or parent) so it appears neatly below the input
        if (ctx.containerEl) {
            ctx.containerEl.appendChild(errorSpan);
        } else if (element.nextSibling) {
            element.parentNode.insertBefore(errorSpan, element.nextSibling);
        } else {
            element.parentNode.appendChild(errorSpan);
        }
    }

    // 2. Clear Inline Error on a specific input element
    function clearFieldError(element) {
        if (!element) return;

        // If event came from Materialize's generated dropdown input or file path input, resolve base element
        let baseElement = element;
        if (element.classList.contains('select-dropdown')) {
            baseElement = element.closest('.select-wrapper')?.querySelector('select') || element;
        } else if (element.classList.contains('file-path')) {
            baseElement = element.closest('.file-field')?.querySelector('input[type="file"]') || element;
        }

        const ctx = resolveElementContext(baseElement);

        baseElement.classList.remove('has-error', 'shake-element');
        baseElement.removeAttribute('aria-invalid');
        baseElement.removeAttribute('aria-describedby');

        if (ctx.visibleEl && ctx.visibleEl !== baseElement) {
            ctx.visibleEl.classList.remove('has-error', 'shake-element');
            ctx.visibleEl.removeAttribute('aria-invalid');
            ctx.visibleEl.removeAttribute('aria-describedby');
        }
        if (ctx.selectWrapper) {
            ctx.selectWrapper.classList.remove('has-error');
        }

        const errorId = `${baseElement.id || 'field'}-error-msg`;
        const existingError = document.getElementById(errorId);
        if (existingError) {
            existingError.remove();
        }

        // Also clean up any lingering field-error inside container if any
        if (ctx.containerEl) {
            const residualError = ctx.containerEl.querySelector('.field-error');
            if (residualError) residualError.remove();
        }
    }

    // 3. Clear all form errors
    function clearAllErrors(form) {
        if (!form) return;
        form.querySelectorAll('.has-error').forEach((el) => {
            el.classList.remove('has-error', 'shake-element');
            el.removeAttribute('aria-invalid');
            el.removeAttribute('aria-describedby');
        });
        form.querySelectorAll('.field-error').forEach((err) => err.remove());
        const existingBanner = form.querySelector('.feedback-banner');
        if (existingBanner) existingBanner.remove();
    }

    // 4. Render Dismissible Feedback Alert Banner
    function showFeedbackBanner(form, type, message) {
        if (!form) return;

        const existing = form.querySelector('.feedback-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.className = `feedback-banner banner-${type}`;
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'polite');

        const icon = type === 'success' ? '✅' : '⚠️';

        banner.innerHTML = `
            <div class="banner-content">
                <span class="banner-icon">${icon}</span>
                <span>${message}</span>
            </div>
            <button type="button" class="banner-close-btn" aria-label="Close notification">&times;</button>
        `;

        banner.querySelector('.banner-close-btn').addEventListener('click', () => {
            banner.remove();
        });

        // Insert at the very top of the form
        form.insertBefore(banner, form.firstChild);
    }

    // 5. Programmatic Auto-scroll to the first invalid input element and focus
    function scrollToFirstError(element) {
        if (!element) return;
        const ctx = resolveElementContext(element);
        const target = ctx.visibleEl || element;

        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            try {
                target.focus({ preventScroll: true });
            } catch (e) {
                target.focus();
            }
        }, 320);
    }

    // 6. Main Orchestrator: Display Form Errors with Banner and Auto-scroll
    function showFormErrors(form, errors) {
        if (!form) return;
        clearAllErrors(form);

        if (errors && errors.length > 0) {
            errors.forEach((err) => {
                showFieldError(err.element, err.message);
            });

            // Display top-level error summary banner
            showFeedbackBanner(form, 'error', 'Please correct the highlighted fields before submitting.');

            // Smooth scroll and focus on the very first invalid input
            scrollToFirstError(errors[0].element);
        }
    }

    // 7. Success Feedback Handler: Display Success Banner, Toast, and Reset
    function showSuccessFeedback(form, message) {
        if (!form) return;
        clearAllErrors(form);

        const successMsg = message || 'Report submitted successfully! Thank you for helping our campus community.';
        showFeedbackBanner(form, 'success', successMsg);

        // Optional Materialize toast integration for natural feel
        if (window.M && typeof window.M.toast === 'function') {
            window.M.toast({ html: successMsg, classes: 'rounded', displayLength: 4000 });
        }

        // Smooth scroll to top of form so the success banner is clearly visible
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Initialize listeners when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('report-item-form');
        if (!form) return;

        // Real-time error clearing as user modifies fields
        form.addEventListener('input', (e) => {
            clearFieldError(e.target);
        });

        form.addEventListener('change', (e) => {
            clearFieldError(e.target);
        });

        // Listen for custom validation events (if dispatched)
        form.addEventListener('form-validation-failed', (e) => {
            if (e.detail && e.detail.errors) {
                showFormErrors(form, e.detail.errors);
            }
        });

        form.addEventListener('form-validation-passed', (e) => {
            const message = e.detail?.message;
            showSuccessFeedback(form, message);
        });
    });

    // Expose API for direct programmatic use
    window.formFeedback = {
        showFieldError: showFieldError,
        clearFieldError: clearFieldError,
        clearAllErrors: clearAllErrors,
        showFeedbackBanner: showFeedbackBanner,
        scrollToFirstError: scrollToFirstError,
        showFormErrors: showFormErrors,
        showSuccessFeedback: showSuccessFeedback
    };
})();
