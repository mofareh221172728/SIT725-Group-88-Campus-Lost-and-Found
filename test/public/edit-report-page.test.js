'use strict';

const assert = require('node:assert/strict');
const { getEditTarget, loadEditPage } = require('../../public/js/edit-report-page');

const reportId = '650000000000000000000101';

describe('Edit report page connector', () => {
  it('reads and validates the report type and ID from the URL', () => {
    assert.deepEqual(
      getEditTarget(`?type=FOUND&id=${reportId}`),
      { type: 'found', id: reportId },
    );
    assert.throws(() => getEditTarget('?type=other&id=bad'), /valid report link/);
    assert.throws(() => getEditTarget(`?type=found&id=${reportId}1`), /valid report link/);
  });

  it('loads the session and protected report, then saves through PUT', async () => {
    const calls = [];
    const report = { id: reportId, ownerId: 'owner-1', type: 'found' };
    const client = {
      async get(url) {
        calls.push(['get', url]);
        if (url === '/api/auth/me') return { user: { id: 'owner-1' } };
        return { report };
      },
      async put(url, data) {
        calls.push(['put', url, data]);
        return { message: 'Report updated successfully.' };
      },
    };
    let mounted;
    let loading = false;
    const formView = {
      setLoading() { loading = true; },
      setError() { assert.fail('setError should not be called'); },
      mount(options) { mounted = options; return true; },
    };

    const result = await loadEditPage({
      search: `?type=found&id=${reportId}`,
      client,
      formView,
    });

    assert.equal(result, true);
    assert.equal(loading, true);
    assert.equal(mounted.report, report);
    assert.equal(mounted.currentUserId, 'owner-1');
    assert.deepEqual(calls, [
      ['get', '/api/auth/me'],
      ['get', `/api/items/found/${reportId}/edit`],
    ]);

    const changes = { title: 'Updated title' };
    assert.deepEqual(
      await mounted.onSave({ id: reportId, type: 'found', changes }),
      { saved: true, message: 'Report updated successfully.' },
    );
    assert.deepEqual(calls[2], [
      'put',
      `/api/items/found/${reportId}`,
      changes,
    ]);
  });

  it('locks the form and shows API or invalid-link errors', async () => {
    const errors = [];
    let loadingCount = 0;
    const formView = {
      setLoading() { loadingCount += 1; },
      setError(message) { errors.push(message); },
      mount() { assert.fail('mount should not be called'); },
    };
    const client = {
      async get() { throw new Error('Authentication is required.'); },
    };

    assert.equal(await loadEditPage({
      search: `?type=found&id=${reportId}`,
      client,
      formView,
    }), false);
    assert.equal(await loadEditPage({
      search: '?type=found&id=bad',
      client,
      formView,
    }), false);
    assert.equal(loadingCount, 2);
    assert.deepEqual(errors, [
      'Authentication is required.',
      'A valid report link is required. Please return to My Reports.',
    ]);
  });
});
