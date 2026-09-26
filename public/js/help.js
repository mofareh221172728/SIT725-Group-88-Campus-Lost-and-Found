/**
 * Help page: FAQ search and category filter.
 * The Ask a question form is not connected yet (see card #118).
 */

function normaliseText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Returns true when a FAQ entry matches the selected category and search text.
function faqMatches(faq, query, category) {
  const inCategory = !category || category === 'all' || faq.category === category;
  if (!inCategory) return false;

  const words = normaliseText(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;

  const text = normaliseText(`${faq.question} ${faq.answer}`);
  return words.every((word) => text.includes(word));
}

function initHelpPage() {
  const searchInput = document.getElementById('faq-search');
  const categoryButtons = document.querySelectorAll('.help-categories .chip-btn');
  const items = Array.from(document.querySelectorAll('#faq-list .faq-item'));
  const emptyMessage = document.getElementById('faq-empty');

  if (!searchInput || items.length === 0) return;

  let activeCategory = 'all';

  function applyFilters() {
    let visibleCount = 0;

    items.forEach((item) => {
      const faq = {
        category: item.dataset.category,
        question: item.querySelector('summary')?.textContent,
        answer: item.querySelector('p')?.textContent,
      };
      const visible = faqMatches(faq, searchInput.value, activeCategory);
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    emptyMessage.hidden = visibleCount > 0;
  }

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      categoryButtons.forEach((other) => {
        const isActive = other === button;
        other.classList.toggle('active', isActive);
        other.setAttribute('aria-pressed', String(isActive));
      });
      applyFilters();
    });
  });

  searchInput.addEventListener('input', applyFilters);

  // The form stays disabled until the Help API is available.
  const form = document.getElementById('help-question-form');
  if (form) {
    form.addEventListener('submit', (event) => event.preventDefault());
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initHelpPage);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { faqMatches, normaliseText };
}
