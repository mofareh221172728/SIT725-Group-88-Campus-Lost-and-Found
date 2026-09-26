'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
const FoundItem = require('../../models/foundItem.model');
const LostItem = require('../../models/lostItem.model');
const db = require('../helpers/db');
const seed = require('../helpers/seed');

const BULK_URL = '/api/admin/reports/bulk-actions';
const COUNT_URL = '/api/admin/reports/stale-count';

describe('Admin Routes - Bulk Actions (POST /api/admin/reports/bulk-actions)', () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const adminEmail = seed.sampleUsers[2].email; // admin.test@deakin.edu.au

  // seedUsers and seedStaleReports each clear their own collections first, so every
  // test starts from the same data even if the test database was seeded before.
  beforeEach(async () => {
    await seed.seedUsers();
    await seed.seedStaleReports();
  });

  // Returns a supertest agent with an active admin session.
  async function adminAgent() {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: adminEmail });
    return agent;
  }

  const statusOf = async (Model, title) => (await Model.findOne({ title })).status;

  describe('[POSITIVE] Bulk Resolve - Correct Targeting', () => {
    it('TC-ADMIN-BULK-01: should resolve only active reports older than 90 days and return how many', async () => {
      const admin = await adminAgent();

      const res = await admin.post(BULK_URL).send({ action: 'resolve-stale' });

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ count: 2 });

      expect(await statusOf(FoundItem, 'Stale Found Umbrella')).to.equal('resolved');
      expect(await statusOf(LostItem, 'Stale Lost Laptop Sleeve')).to.equal('resolved');
      expect(await statusOf(FoundItem, 'Fresh Found Calculator')).to.equal('active');
      expect(await statusOf(LostItem, 'Recent Report Of An Old Loss')).to.equal('active');
      expect(await statusOf(FoundItem, 'Stale Resolved Found Keys')).to.equal('resolved');
    });
  });

  describe('[POSITIVE] Stale Count Consistency', () => {
    it('TC-ADMIN-BULK-02: should resolve exactly the number that stale-count previewed', async () => {
      const admin = await adminAgent();

      const preview = await admin.get(COUNT_URL);
      const run = await admin.post(BULK_URL).send({ action: 'resolve-stale' });
      const after = await admin.get(COUNT_URL);

      expect(run.body.count).to.equal(preview.body.count);
      expect(after.body).to.deep.equal({ count: 0 });
    });
  });

  describe('[BOUNDARY] Idempotency', () => {
    it('TC-ADMIN-BULK-03: should resolve 0 reports on a second run', async () => {
      const admin = await adminAgent();

      const first = await admin.post(BULK_URL).send({ action: 'resolve-stale' });
      const second = await admin.post(BULK_URL).send({ action: 'resolve-stale' });

      expect(first.body).to.deep.equal({ count: 2 });
      expect(second.status).to.equal(200);
      expect(second.body).to.deep.equal({ count: 0 });
    });
  });

  describe('[TYPE & ENUM] Unknown Action', () => {
    it('TC-ADMIN-BULK-04: should reject an unknown action with 400 and change nothing', async () => {
      const admin = await adminAgent();

      const res = await admin.post(BULK_URL).send({ action: 'delete-everything' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Unknown bulk action. Supported actions: resolve-stale.');
      expect(await statusOf(FoundItem, 'Stale Found Umbrella')).to.equal('active');
    });
  });
});
