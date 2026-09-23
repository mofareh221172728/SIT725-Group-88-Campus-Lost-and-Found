(function (root) {
  'use strict';

  function getEditTarget(search) {
    const params = new URLSearchParams(search || '');
    const type = String(params.get('type') || '').toLowerCase();
    const id = String(params.get('id') || '');

    if (!['lost', 'found'].includes(type) || !/^[a-f\d]{24}$/i.test(id)) {
      throw new Error('A valid report link is required. Please return to My Reports.');
    }

    return { type, id };
  }

  async function loadEditPage({ search, client, formView } = {}) {
    const apiClient = client || root.api;
    const view = formView || root.editReportForm;

    if (!apiClient || !view) return false;
    view.setLoading();

    try {
      const target = getEditTarget(
        search === undefined ? root.location?.search : search,
      );
      const [session, result] = await Promise.all([
        apiClient.get('/api/auth/me'),
        apiClient.get(`/api/items/${target.type}/${target.id}/edit`),
      ]);

      return view.mount({
        report: result.report,
        currentUserId: session.user.id,
        onSave: async ({ id, type, changes }) => {
          const saved = await apiClient.put(`/api/items/${type}/${id}`, changes);
          return { saved: true, message: saved.message };
        },
      });
    } catch (error) {
      view.setError(error.message || 'Unable to load this report.');
      return false;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getEditTarget, loadEditPage };
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => loadEditPage());
  }
})(typeof window === 'undefined' ? globalThis : window);
