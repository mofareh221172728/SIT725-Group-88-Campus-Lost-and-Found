'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
const db = require('../helpers/db');
const seed = require('../helpers/seed');

// Edge cases only; basic search and filter cases are TC-API-SEARCH / TC-API-FILTER in items.routes.test.js.
// Active seed reports: bottle (Burwood, 09-01), calculator (Waurn Ponds, 09-02), wallet (Burwood, 09-03).
describe('Integration - Search & Filter Edge Cases (GET /api/items)', () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const BOTTLE = 'Blue Hydro Flask Water Bottle';
  const CALCULATOR = 'Graphing Calculator TI-84';
  const WALLET = 'Black Leather Bi-fold Wallet';

  async function search(query) {
    const res = await request(app).get('/api/items').query(query);
    expect(res.status).to.equal(200);
    return res.body;
  }

  const titlesOf = async (query) => (await search(query)).map((item) => item.title).sort();

  describe('[LENGTH/FORMAT] Keyword Matching', () => {
    it('TC-SEARCH-EDGE-01: should match partial keywords in any letter case', async () => {
      expect(await titlesOf({ keyword: 'HYDRO' })).to.deep.equal([BOTTLE]);
      expect(await titlesOf({ keyword: 'calc' })).to.deep.equal([CALCULATOR]);
    });

    it('TC-SEARCH-EDGE-02: should trim spaces around the keyword', async () => {
      expect(await titlesOf({ keyword: '  wallet  ' })).to.deep.equal([WALLET]);
    });

    it('TC-SEARCH-EDGE-03: should treat regex characters as plain text', async () => {
      expect(await titlesOf({ keyword: '.*' })).to.deep.equal([]);
      expect(await titlesOf({ keyword: '(' })).to.deep.equal([]);
      expect(await titlesOf({ keyword: '2.10' })).to.deep.equal([CALCULATOR]);
      expect(await titlesOf({ keyword: '2x10' })).to.deep.equal([]);
    });

    it('TC-SEARCH-EDGE-04: should never return resolved reports', async () => {
      expect(await titlesOf({ keyword: 'earbuds' })).to.deep.equal([]);
    });
  });

  describe('[CONDITIONAL] Combined Filters', () => {
    it('TC-SEARCH-EDGE-05: should narrow a keyword by type and by category', async () => {
      expect(await titlesOf({ keyword: 'black' })).to.deep.equal([WALLET, CALCULATOR]);
      expect(await titlesOf({ keyword: 'black', type: 'lost' })).to.deep.equal([WALLET]);
      expect(await titlesOf({ keyword: 'black', category: 'Electronics' })).to.deep.equal([CALCULATOR]);
    });

    it('TC-SEARCH-EDGE-06: should match category exactly, ignoring letter case', async () => {
      expect(await titlesOf({ category: 'electronics' })).to.deep.equal([CALCULATOR]);
      expect(await titlesOf({ category: 'Electron' })).to.deep.equal([]);
    });

    it('TC-SEARCH-EDGE-07: should match part of a campus location', async () => {
      expect(await titlesOf({ location: 'burw' })).to.deep.equal([WALLET, BOTTLE]);
    });

    it('TC-SEARCH-EDGE-08: should return an empty list when the filters do not overlap', async () => {
      expect(await titlesOf({ category: 'Electronics', location: 'Burwood' })).to.deep.equal([]);
    });
  });

  describe('[BOUNDARY] Date Range', () => {
    it('TC-SEARCH-EDGE-09: should include reports from a single-day range', async () => {
      expect(await titlesOf({ fromDate: '2026-09-01', toDate: '2026-09-01' })).to.deep.equal([BOTTLE]);
    });

    it('TC-SEARCH-EDGE-10: should exclude reports just outside the start or end date', async () => {
      expect(await titlesOf({ toDate: '2026-08-31' })).to.deep.equal([]);
      expect(await titlesOf({ fromDate: '2026-09-04' })).to.deep.equal([]);
    });

    it('TC-SEARCH-EDGE-11: should accept only a start date or only an end date', async () => {
      expect(await titlesOf({ fromDate: '2026-09-02' })).to.deep.equal([WALLET, CALCULATOR]);
      expect(await titlesOf({ toDate: '2026-09-02' })).to.deep.equal([BOTTLE, CALCULATOR]);
    });

    it('TC-SEARCH-EDGE-12: should reject an invalid end date on its own with 400', async () => {
      const res = await request(app).get('/api/items').query({ toDate: '2026-13-01' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('toDate must be a valid date in YYYY-MM-DD format.');
    });
  });

  describe('[BOUNDARY] Pagination with Filters', () => {
    it('TC-SEARCH-EDGE-13: should page through filtered results using the filtered total', async () => {
      const query = { location: 'Burwood', sort: 'newest', limit: 1 };

      const first = await search({ ...query, page: 1 });
      const second = await search({ ...query, page: 2 });

      expect(first).to.include({ total: 2, page: 1, totalPages: 2 });
      expect(first.items.map((item) => item.title)).to.deep.equal([WALLET]);
      expect(second.items.map((item) => item.title)).to.deep.equal([BOTTLE]);
    });
  });

  describe('[POSITIVE] Clearing Filters', () => {
    it('TC-SEARCH-EDGE-14: should return the default listing, newest first, for a cleared search', async () => {
      expect(await titlesOf({ keyword: 'black', type: 'lost', location: 'Burwood' })).to.have.length(1);

      // The Clear all filters button sends only the sort order.
      const cleared = await search({ sort: 'newest' });

      expect(cleared.map((item) => item.title)).to.deep.equal([WALLET, CALCULATOR, BOTTLE]);
      expect(cleared.map((item) => item.id).sort()).to.deep.equal((await search({})).map((item) => item.id).sort());
    });
  });
});
