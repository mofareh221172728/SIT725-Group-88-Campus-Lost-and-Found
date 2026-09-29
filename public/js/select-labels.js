/**
 * Materialize hides each <select> and shows a generated
 * <input class="select-dropdown"> instead. That input has no label, so
 * screen readers announce an unnamed field (axe: "Form elements must have
 * labels", WCAG 1.3.1 / 4.1.2).
 *
 * Call this after M.AutoInit() or M.FormSelect.init(). It copies the text of
 * the <select>'s <label> onto the generated input as aria-label.
 */
function labelMaterializeSelects(scope) {
  const root = scope || document;
  root.querySelectorAll('.select-wrapper').forEach((wrapper) => {
    const select = wrapper.querySelector('select');
    const input = wrapper.querySelector('input.select-dropdown');
    if (!select || !input || !select.id) return;

    const label = document.querySelector(`label[for="${select.id}"]`);
    const text = label ? label.textContent.replace(/\*/g, '').trim() : '';
    if (text) input.setAttribute('aria-label', text);
  });
}

if (typeof window !== 'undefined') {
  window.labelMaterializeSelects = labelMaterializeSelects;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { labelMaterializeSelects };
}
