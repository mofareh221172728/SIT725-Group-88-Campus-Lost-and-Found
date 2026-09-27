/**
 * Fallback UI states for pages that load data: loading, empty,
 * not found and error (with an optional "Try again" button).
 *
 * Form validation errors are handled by form-feedback.js; this file is
 * for whole sections or pages whose data is missing or failed to load.
 *
 * Usage:
 *   showUiState(container, {
 *     type: 'error',
 *     title: 'Unable to load reports',
 *     message: 'Please check your connection.',
 *     actionLabel: 'Try again',
 *     onAction: loadReports,
 *   });
 */

const UI_STATE_DEFAULTS = {
  loading: { title: 'Loading…', message: '' },
  empty: { title: 'Nothing here yet', message: '' },
  'not-found': {
    title: 'Not found',
    message: 'This item does not exist or is no longer available.',
  },
  error: {
    title: 'Something went wrong',
    message: 'Please check your connection and try again.',
  },
};

function uiStateEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only allow same-site links, so a bad href can never run script.
function uiStateSafeHref(href) {
  const value = String(href || '');
  return /^(\/|[a-z0-9-]+\.html)/i.test(value) && !/^\/\//.test(value) ? value : '#';
}

// Builds the markup for a state. Errors use role="alert" so screen readers
// announce them straight away; other states are announced politely.
function uiStateHTML(options = {}) {
  const type = UI_STATE_DEFAULTS[options.type] ? options.type : 'error';
  const defaults = UI_STATE_DEFAULTS[type];
  const title = options.title ?? defaults.title;
  const message = options.message ?? defaults.message;
  const role = type === 'error' ? 'alert' : 'status';
  const live = type === 'error' ? 'assertive' : 'polite';

  const icon = {
    loading: '<span class="ui-state-spinner" aria-hidden="true"></span>',
    empty: '<span class="ui-state-icon" aria-hidden="true">○</span>',
    'not-found': '<span class="ui-state-icon" aria-hidden="true">?</span>',
    error: '<span class="ui-state-icon" aria-hidden="true">!</span>',
  }[type];

  const action = options.actionLabel && type !== 'loading'
    ? `<button type="button" class="btn-wf-strong ui-state-action">${uiStateEscape(options.actionLabel)}</button>`
    : '';

  const links = (options.links || [])
    .map((link) => `<a class="btn-wf ui-state-link" href="${uiStateEscape(uiStateSafeHref(link.href))}">${uiStateEscape(link.label)}</a>`)
    .join('');

  const buttons = action || links ? `<div class="ui-state-actions">${action}${links}</div>` : '';

  return `
    <div class="ui-state ui-state-${type}" role="${role}" aria-live="${live}"${type === 'loading' ? ' aria-busy="true"' : ''}>
      ${icon}
      <p class="ui-state-title">${uiStateEscape(title)}</p>
      ${message ? `<p class="ui-state-message">${uiStateEscape(message)}</p>` : ''}
      ${buttons}
    </div>`;
}

// Shows a state inside a container and wires up the action button.
function showUiState(container, options = {}) {
  if (!container) return null;
  container.innerHTML = uiStateHTML(options);
  container.hidden = false;

  const button = container.querySelector('.ui-state-action');
  if (button && typeof options.onAction === 'function') {
    button.addEventListener('click', () => {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      options.onAction();
    });
  }
  return container.firstElementChild;
}

function clearUiState(container) {
  if (!container) return;
  container.innerHTML = '';
  container.hidden = true;
}

if (typeof window !== 'undefined') {
  window.showUiState = showUiState;
  window.clearUiState = clearUiState;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { uiStateHTML, showUiState, clearUiState, uiStateSafeHref };
}
