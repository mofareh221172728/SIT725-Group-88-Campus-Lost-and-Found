(function (root) {
  'use strict';

  function editUrl(report) {
    return `edit-report.html?type=${encodeURIComponent(report.type)}&id=${encodeURIComponent(report.id)}`;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { editUrl };
  }
  if (typeof document === 'undefined') return;

  const message = document.getElementById('reports-message');
  if (!message) return;

  function setMessage(text, loginRequired = false) {
    message.replaceChildren(document.createTextNode(text));
    if (loginRequired) {
      const link = document.createElement('a');
      link.href = 'index.html';
      link.textContent = ' Log in';
      message.append(link);
    }
  }

  function photoElement(report) {
    const placeholder = document.createElement('div');
    placeholder.className = 'ph report-photo';
    placeholder.textContent = 'No photo';
    const photo = report.photos?.[0];
    if (typeof photo !== 'string') return placeholder;
    try {
      const url = new URL(photo, root.location.href);
      if (!['http:', 'https:'].includes(url.protocol)) return placeholder;
      const image = document.createElement('img');
      image.className = 'report-photo';
      image.src = url.href;
      image.alt = '';
      image.addEventListener('error', () => image.replaceWith(placeholder));
      return image;
    } catch {
      return placeholder;
    }
  }

  function rowElement(report) {
    const row = document.createElement('div');
    row.className = 'report-row';
    row.append(photoElement(report));

    const details = document.createElement('div');
    details.className = 'report-details';
    const title = document.createElement('strong');
    title.textContent = report.title;
    const info = document.createElement('div');
    const date = report.date && !Number.isNaN(Date.parse(report.date))
      ? new Date(report.date).toLocaleDateString('en-AU') : '';
    info.textContent = [report.category, report.location, date].filter(Boolean).join(' · ');
    const resolved = report.status === 'resolved';
    const badge = document.createElement('span');
    badge.className = `badge-wf status-badge ${resolved ? 'badge-resolved' : 'badge-active'}`;
    badge.textContent = resolved ? 'Resolved' : 'Active';
    details.append(title, info, badge);
    row.append(details);

    const actions = document.createElement('div');
    actions.className = 'report-actions';
    if (!resolved) {
      const edit = document.createElement('a');
      edit.className = 'btn-wf';
      edit.href = editUrl(report);
      edit.textContent = 'Edit';
      actions.append(edit);

      const resolve = document.createElement('button');
      resolve.type = 'button';
      resolve.className = 'btn-wf';
      resolve.textContent = 'Resolve';
      resolve.addEventListener('click', async () => {
        if (!root.confirm(`Mark "${report.title}" as resolved?`)) return;
        resolve.disabled = true;
        try {
          await root.api.put(`/api/items/${report.type}/${report.id}/status`, { status: 'resolved' });
          if (!(await loadReports())) resolve.disabled = false;
        } catch (error) {
          if (error.status === 401) {
            renderSection('found', []);
            renderSection('lost', []);
            setMessage('Please log in to view your reports.', true);
          } else {
            setMessage(error.message || 'Unable to resolve this report.');
          }
          resolve.disabled = false;
        }
      });
      actions.append(resolve);
    }
    row.append(actions);
    return row;
  }

  function renderSection(type, reports) {
    document.getElementById(`${type}-heading`).textContent =
      `Items I ${type === 'found' ? 'Found' : 'Lost'} (${reports.length})`;
    const list = document.getElementById(`${type}-reports`);
    list.replaceChildren();
    if (!reports.length) {
      const empty = document.createElement('p');
      empty.className = 'reports-empty';
      empty.textContent = `You have no ${type} reports.`;
      list.append(empty);
      return;
    }
    reports.forEach(report => list.append(rowElement(report)));
  }

  async function loadReports() {
    try {
      const result = await root.api.get('/api/items/mine');
      if (!Array.isArray(result.found) || !Array.isArray(result.lost)) {
        throw new Error('Unable to load your reports.');
      }
      renderSection('found', result.found);
      renderSection('lost', result.lost);
      setMessage('');
      return true;
    } catch (error) {
      renderSection('found', []);
      renderSection('lost', []);
      setMessage(error.status === 401 ? 'Please log in to view your reports.' :
        (error.message || 'Unable to load your reports.'), error.status === 401);
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', loadReports);
})(typeof window === 'undefined' ? globalThis : window);
