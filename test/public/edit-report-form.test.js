'use strict';

const assert = require('node:assert/strict');
const { prepareReport, validateEdits } = require('../../public/js/edit-report-form');

const found = {
  _id: 'found-1', ownerId: 'owner-1', type: 'found', title: 'Blue Water Bottle',
  category: 'Bottles & Containers', description: 'Blue bottle with a black lid.',
  foundAt: '2026-09-01T10:30:00.000Z', campusLocation: 'Burwood, Building LC, Room 2.10',
  contactMethod: 'collection', collectionLocation: 'Campus Security', status: 'active'
};

describe('Edit report form', () => {
  it('prefills a full Found report without losing its stored location', () => {
    const report = prepareReport(found, 'owner-1');
    assert.equal(report.id, 'found-1');
    assert.equal(report.data.location, found.campusLocation);
    assert.equal(report.data.date, '2026-09-01');
    assert.equal(report.data.handoverMethod, 'dropoff');
    assert.equal(report.data.collectionLocation, 'Campus Security');
  });

  it('supports a Lost report', () => {
    const report = prepareReport({
      ...found,
      type: 'lost',
      lostAt: '2026-09-02T10:00:00Z',
      status: 'active'
    }, 'owner-1');
    assert.equal(report.data.date, '2026-09-02');
    assert.equal(report.status, 'Active');
    assert.equal(report.data.handoverMethod, '');
    assert.equal(report.data.collectionLocation, '');
  });

  it('blocks editing a resolved report', () => {
    assert.throws(
      () => prepareReport({ ...found, status: 'resolved' }, 'owner-1'),
      /Only active reports/
    );
  });

  it('blocks missing sessions, other owners, missing ownership and invalid report identity', () => {
    assert.throws(() => prepareReport(found, null), /sign in/);
    assert.throws(() => prepareReport(found, 'owner-2'), /own reports/);
    assert.throws(() => prepareReport({ ...found, ownerId: null }, 'owner-1'), /own reports/);
    assert.throws(() => prepareReport({ ...found, _id: '' }, 'owner-1'), /Unable to load/);
    assert.throws(() => prepareReport({ ...found, type: 'invalid' }, 'owner-1'), /Unable to load/);
  });

  it('accepts a populated owner and preserves campus-only and custom-category records', () => {
    const report = prepareReport({ ...found, ownerId: { _id: 'owner-1' }, campusLocation: 'Burwood', category: 'Musical Instruments' }, 'owner-1');
    assert.equal(report.data.location, 'Burwood');
    assert.equal(report.data.category, 'Musical Instruments');
    assert.equal(validateEdits(report.data, 'found').isValid, true);
  });

  it('reuses title, description, required-field and future-date validation', () => {
    const data = prepareReport(found, 'owner-1').data;
    const invalid = { ...data, title: 'abc', description: 'short', category: '', location: ' ', date: '2999-01-01' };
    assert.deepEqual(validateEdits(invalid, 'found').errors.map(error => error.field), ['title', 'category', 'date', 'description', 'location']);
    assert.equal(validateEdits({ ...data, title: 'a'.repeat(101), description: 'a'.repeat(1001) }, 'found').errors.length, 2);
    assert.equal(validateEdits({ ...data, title: 'a'.repeat(100), description: 'a'.repeat(1000) }, 'found').isValid, true);
  });

  it('requires a handover method and a collection location only for dropoff', () => {
    const data = prepareReport(found, 'owner-1').data;
    assert.equal(validateEdits({ ...data, handoverMethod: '' }, 'found').isValid, false);
    assert.equal(validateEdits({ ...data, collectionLocation: ' ' }, 'found').isValid, false);
    const email = validateEdits({ ...data, handoverMethod: 'email' }, 'found');
    assert.equal(email.isValid, true);
    assert.equal(email.data.collectionLocation, null);
    const lost = validateEdits({ ...data, handoverMethod: '' }, 'lost');
    assert.equal(lost.isValid, true);
    assert.equal(lost.data.handoverMethod, null);
    assert.equal(lost.data.collectionLocation, null);
  });

  it('trims editable values and excludes identity, status and photos from changes', () => {
    const data = prepareReport(found, 'owner-1').data;
    const result = validateEdits({ ...data, title: '  Blue Bottle  ', ownerId: 'owner-2', status: 'resolved', type: 'lost', photos: [] }, 'found');
    assert.equal(result.data.title, 'Blue Bottle');
    assert.deepEqual(Object.keys(result.data).sort(), ['category', 'collectionLocation', 'date', 'description', 'handoverMethod', 'location', 'title']);
  });
});
