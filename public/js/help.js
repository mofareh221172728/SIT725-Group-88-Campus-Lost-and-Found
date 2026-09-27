/**
 * Help page: FAQ search and category filter, plus the Ask a question form
 * and the My questions list, which use the Help API (/api/help).
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

const QUESTION_LIMITS = {
  title: { min: 5, max: 150, label: 'Title' },
  body: { min: 10, max: 2000, label: 'Question' },
};

const CATEGORY_LABELS = {
  'getting-started': 'Getting started',
  reporting: 'Reporting',
  finding: 'Finding',
  managing: 'Managing',
  other: 'Other',
};

// Checks the form values with the same limits as the HelpQuestion model.
function validateQuestion(input) {
  const values = {
    title: String(input.title || '').trim(),
    body: String(input.body || '').trim(),
    category: input.category || 'other',
  };
  const errors = {};

  Object.entries(QUESTION_LIMITS).forEach(([field, { min, max, label }]) => {
    const length = values[field].length;
    if (length === 0) {
      errors[field] = `${label} is required.`;
    } else if (length < min) {
      errors[field] = `${label} must be at least ${min} characters.`;
    } else if (length > max) {
      errors[field] = `${label} must be ${max} characters or fewer.`;
    }
  });

  return { values, errors, valid: Object.keys(errors).length === 0 };
}

// Checks a reply with the same limits as the HelpReply model.
function validateReply(input) {
  const body = String(input || '').trim();
  let error = '';
  if (body.length === 0) error = 'Reply is required.';
  else if (body.length < 2) error = 'Reply must be at least 2 characters.';
  else if (body.length > 1000) error = 'Reply must be 1000 characters or fewer.';
  return { body, error, valid: error === '' };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Date and time in the viewer's local time, e.g. "27 Sept 2026, 3:05 pm".
function formatHelpDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day}, ${time}`;
}

function statusBadgeHTML(status) {
  const answered = status === 'answered';
  return `<span class="badge-wf help-status ${answered ? 'badge-active' : ''}">${answered ? 'Answered' : 'Open'}</span>`;
}

// One question in the list. Replies load when it is opened.
// Admins also see who asked the question.
function questionItemHTML(question, options = {}) {
  const category = CATEGORY_LABELS[question.category] || 'Other';
  const id = escapeHtml(question.id);
  const replyLabel = options.isAdmin ? 'Reply to student' : 'Add a follow-up';
  const from = options.isAdmin && question.ownerEmail
    ? `<span class="help-question-owner">From ${escapeHtml(question.ownerEmail)}</span>`
    : '';
  return `
    <details class="help-question" data-question-id="${id}" data-owner-id="${escapeHtml(question.ownerId)}">
      <summary>
        <span class="help-question-title">${escapeHtml(question.title)}</span>
        <span class="help-question-meta">
          ${statusBadgeHTML(question.status)}
          <span>${escapeHtml(category)}</span>
          <span>${escapeHtml(formatHelpDate(question.createdAt))}</span>
          ${from}
        </span>
      </summary>
      <p class="help-question-body">${escapeHtml(question.body)}</p>
      <div class="help-question-actions">
        ${options.isAdmin ? '' : '<button type="button" class="btn-link-wf" data-action="edit">Edit</button>'}
        <button type="button" class="btn-link-wf help-delete" data-action="delete">Delete</button>
      </div>
      <div class="help-question-edit" hidden></div>
      <div class="help-replies" aria-live="polite">
        <p class="help-replies-empty">Loading replies…</p>
      </div>
      <form class="help-reply-form" novalidate>
        <label for="reply-${id}">${replyLabel}</label>
        <textarea id="reply-${id}" name="body" class="input-wf-real" rows="2" maxlength="1000" required></textarea>
        <p class="help-field-error" hidden></p>
        <div class="flex justify-end">
          <button type="submit" class="btn-wf">Send reply</button>
        </div>
      </form>
    </details>`;
}

// Inline form for the owner to update a question.
function editFormHTML(question) {
  const id = escapeHtml(question.id);
  const options = Object.entries(CATEGORY_LABELS).map(([value, label]) =>
    `<option value="${value}" ${value === question.category ? 'selected' : ''}>${label}</option>`).join('');
  return `
    <form class="help-edit-form" novalidate>
      <div class="field-wf">
        <label for="edit-category-${id}">Category</label>
        <select id="edit-category-${id}" name="category" class="select-wf">${options}</select>
      </div>
      <div class="field-wf">
        <label for="edit-title-${id}">Title</label>
        <input id="edit-title-${id}" name="title" class="input-wf-real" type="text" maxlength="150" value="${escapeHtml(question.title)}">
        <p id="edit-title-${id}-error" class="help-field-error" hidden></p>
      </div>
      <div class="field-wf">
        <label for="edit-body-${id}">Question</label>
        <textarea id="edit-body-${id}" name="body" class="input-wf-real" rows="3" maxlength="2000">${escapeHtml(question.body)}</textarea>
        <p id="edit-body-${id}-error" class="help-field-error" hidden></p>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn-wf" data-action="cancel-edit">Cancel</button>
        <button type="submit" class="btn-wf-strong">Save changes</button>
      </div>
    </form>`;
}

// The shared api client has no DELETE helper, so send it here
// with the same session cookie and error shape.
async function deleteRequest(url) {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  if (!response.ok) {
    const error = new Error((data && data.message) || `Request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return data;
}

// "You" for the viewer's own replies, "Student" for the question owner
// (when an admin is viewing) and "Admin" for everyone else.
function replyAuthorLabel(authorId, viewerId, ownerId) {
  if (authorId === viewerId) return 'You';
  if (authorId === ownerId) return 'Student';
  return 'Admin';
}

function replyListHTML(replies, viewerId, ownerId) {
  if (!replies || replies.length === 0) {
    return '<p class="help-replies-empty">No replies yet.</p>';
  }
  return replies.map((reply) => `
    <p class="help-reply">
      <span class="help-reply-author">${replyAuthorLabel(reply.authorId, viewerId, ownerId)} · ${escapeHtml(formatHelpDate(reply.createdAt))}</span>
      ${escapeHtml(reply.body)}
    </p>`).join('');
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

  initQuestions();
}

// Ask a question form and the question list.
// Students see their own questions; admins see every student's question.
async function initQuestions() {
  const askSection = document.getElementById('help-ask-section');
  const form = document.getElementById('help-question-form');
  const fields = document.getElementById('help-question-fields');
  const loginPrompt = document.getElementById('help-login-prompt');
  const formMessage = document.getElementById('help-form-message');
  const submitButton = document.getElementById('help-submit');
  const listHeading = document.getElementById('mine-heading');
  const listMessage = document.getElementById('my-questions-message');
  const list = document.getElementById('my-questions');

  if (!form || !fields || !list || typeof api === 'undefined') return;

  const inputs = {
    title: document.getElementById('question-title'),
    body: document.getElementById('question-body'),
    category: document.getElementById('question-category'),
  };

  let viewer = null;
  const questionsById = new Map();
  const isAdmin = () => Boolean(viewer && viewer.role === 'admin');

  function showFormMessage(type, text) {
    formMessage.textContent = text;
    formMessage.className = `help-message is-${type}`;
    formMessage.setAttribute('role', type === 'error' ? 'alert' : 'status');
    formMessage.hidden = false;
  }

  function showFieldError(input, errorBox, message) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) {
      input.setAttribute('aria-describedby', errorBox.id || '');
    } else {
      input.removeAttribute('aria-describedby');
    }
    errorBox.textContent = message || '';
    errorBox.hidden = !message;
  }

  function showFieldErrors(errors) {
    ['title', 'body'].forEach((field) => {
      showFieldError(inputs[field], document.getElementById(`question-${field}-error`), errors[field]);
    });
  }

  function setListMessage(text) {
    listMessage.textContent = text;
    listMessage.hidden = !text;
  }

  async function loadQuestions() {
    const url = isAdmin() ? '/api/help/questions?scope=all' : '/api/help/questions';
    try {
      const data = await api.get(url);
      const questions = data.questions || [];
      questionsById.clear();
      questions.forEach((q) => questionsById.set(q.id, q));
      list.innerHTML = questions.map((q) => questionItemHTML(q, { isAdmin: isAdmin() })).join('');
      if (questions.length === 0) {
        setListMessage(isAdmin() ? 'No students have asked a question yet.' : 'You have not asked any questions yet.');
      } else {
        setListMessage('');
      }
    } catch (error) {
      list.innerHTML = '';
      setListMessage('Unable to load questions. Please try again.');
    }
  }

  async function loadReplies(item) {
    const repliesBox = item.querySelector('.help-replies');
    try {
      const data = await api.get(`/api/help/questions/${encodeURIComponent(item.dataset.questionId)}`);
      repliesBox.innerHTML = replyListHTML(data.question.replies, viewer.id, item.dataset.ownerId);
      item.dataset.loaded = 'true';
    } catch (error) {
      repliesBox.innerHTML = '<p class="help-replies-empty">Unable to load replies. Close and open this question to try again.</p>';
    }
  }

  // Load replies the first time a question is opened.
  list.addEventListener('toggle', (event) => {
    const item = event.target;
    if (item.classList.contains('help-question') && item.open && item.dataset.loaded !== 'true') {
      loadReplies(item);
    }
  }, true);

  function showEmptyListIfNeeded() {
    if (!list.querySelector('.help-question')) {
      setListMessage(isAdmin() ? 'No students have asked a question yet.' : 'You have not asked any questions yet.');
    }
  }

  // Edit, cancel and delete buttons inside a question.
  list.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.type === 'submit') return;
    const item = button.closest('.help-question');
    const question = questionsById.get(item.dataset.questionId);
    const editBox = item.querySelector('.help-question-edit');
    const body = item.querySelector('.help-question-body');
    const actions = item.querySelector('.help-question-actions');

    if (button.dataset.action === 'edit' && question) {
      editBox.innerHTML = editFormHTML(question);
      editBox.hidden = false;
      body.hidden = true;
      actions.hidden = true;
      editBox.querySelector('input').focus();
    }

    if (button.dataset.action === 'cancel-edit') {
      editBox.innerHTML = '';
      editBox.hidden = true;
      body.hidden = false;
      actions.hidden = false;
    }

    if (button.dataset.action === 'delete') {
      const who = isAdmin() ? "this student's question" : 'your question';
      if (!window.confirm(`Delete ${who} and all its replies? This cannot be undone.`)) return;
      button.disabled = true;
      try {
        await deleteRequest(`/api/help/questions/${encodeURIComponent(item.dataset.questionId)}`);
        questionsById.delete(item.dataset.questionId);
        item.remove();
        showEmptyListIfNeeded();
      } catch (error) {
        button.disabled = false;
        window.alert(error.message || 'Unable to delete the question.');
      }
    }
  });

  // Save changes from the inline edit form.
  list.addEventListener('submit', async (event) => {
    const editForm = event.target.closest('.help-edit-form');
    if (!editForm) return;
    event.preventDefault();

    const item = editForm.closest('.help-question');
    const id = item.dataset.questionId;
    const titleInput = editForm.querySelector('[name="title"]');
    const bodyInput = editForm.querySelector('[name="body"]');
    const { values, errors, valid } = validateQuestion({
      title: titleInput.value,
      body: bodyInput.value,
      category: editForm.querySelector('[name="category"]').value,
    });
    showFieldError(titleInput, document.getElementById(`${titleInput.id}-error`), errors.title);
    showFieldError(bodyInput, document.getElementById(`${bodyInput.id}-error`), errors.body);
    if (!valid) return;

    const saveButton = editForm.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    saveButton.setAttribute('aria-busy', 'true');
    try {
      const result = await api.put(`/api/help/questions/${encodeURIComponent(id)}`, values);
      questionsById.set(id, result.question);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = questionItemHTML(result.question, { isAdmin: isAdmin() });
      const updated = wrapper.firstElementChild;
      updated.dataset.loaded = 'true'; // replies are loaded just below
      updated.open = true;
      item.replaceWith(updated);
      loadReplies(updated);
    } catch (error) {
      showFieldError(titleInput, document.getElementById(`${titleInput.id}-error`), error.message || 'Unable to save your changes.');
      saveButton.disabled = false;
      saveButton.removeAttribute('aria-busy');
    }
  });

  // Send a reply from inside an opened question.
  list.addEventListener('submit', async (event) => {
    const replyForm = event.target.closest('.help-reply-form');
    if (!replyForm) return;
    event.preventDefault();

    const item = replyForm.closest('.help-question');
    const textarea = replyForm.querySelector('textarea');
    const errorBox = replyForm.querySelector('.help-field-error');
    const button = replyForm.querySelector('button');
    errorBox.id = `${textarea.id}-error`;

    const { body, error, valid } = validateReply(textarea.value);
    showFieldError(textarea, errorBox, error);
    if (!valid) {
      textarea.focus();
      return;
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const result = await api.post(
        `/api/help/questions/${encodeURIComponent(item.dataset.questionId)}/replies`,
        { body },
      );
      textarea.value = '';
      item.querySelector('.help-status').outerHTML = statusBadgeHTML(result.questionStatus);
      await loadReplies(item);
    } catch (requestError) {
      showFieldError(textarea, errorBox, requestError.message || 'Unable to send your reply.');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formMessage.hidden = true;

    const { values, errors, valid } = validateQuestion({
      title: inputs.title.value,
      body: inputs.body.value,
      category: inputs.category.value,
    });
    showFieldErrors(errors);
    if (!valid) {
      inputs[errors.title ? 'title' : 'body'].focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    try {
      await api.post('/api/help/questions', values);
      form.reset();
      showFieldErrors({});
      showFormMessage('success', 'Question sent. An admin will reply in My questions below.');
      await loadQuestions();
    } catch (error) {
      if (error.status === 401) {
        showFormMessage('error', 'Your session has ended. Please log in again.');
      } else {
        showFormMessage('error', error.message || 'Unable to send your question. Please try again.');
      }
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
    }
  });

  // Only logged-in users can ask questions and see the list.
  try {
    const me = await api.get('/api/auth/me');
    viewer = { id: String(me.user.id), role: me.user.role };
  } catch (error) {
    fields.disabled = true;
    loginPrompt.hidden = false;
    setListMessage(error.status === 401
      ? 'Log in to see your questions.'
      : 'Unable to check your login. Please refresh the page.');
    return;
  }

  if (isAdmin()) {
    // Admins answer questions here instead of asking them.
    if (askSection) askSection.hidden = true;
    listHeading.textContent = 'All questions';
  } else {
    fields.disabled = false;
  }
  await loadQuestions();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initHelpPage);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    faqMatches,
    normaliseText,
    validateQuestion,
    validateReply,
    escapeHtml,
    questionItemHTML,
    replyListHTML,
    replyAuthorLabel,
    editFormHTML,
    formatHelpDate,
  };
}
