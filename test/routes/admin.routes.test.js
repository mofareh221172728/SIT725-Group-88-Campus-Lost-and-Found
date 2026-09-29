'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
const FoundItem = require('../../models/foundItem.model');
const LostItem = require('../../models/lostItem.model');
const adminService = require('../../services/admin.service');
const db = require('../helpers/db');
const seed = require('../helpers/seed');

const BULK_URL = '/api/admin/reports/bulk-actions';
const COUNT_URL = '/api/admin/reports/stale-count';
const STALE_URL = '/api/admin/reports/stale';

// Every /api/admin/* route, used by the access-control tests below.
const ADMIN_ROUTES = [
  { method: 'get', url: COUNT_URL },
  { method: 'get', url: STALE_URL },
  { method: 'post', url: BULK_URL, body: { action: 'resolve-stale' } },
];

describe('Admin Routes (/api/admin/*)', () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const studentEmail = seed.sampleUsers[0].email; // alice.student@deakin.edu.au (default role)
  const adminEmail = seed.sampleUsers[2].email; // admin.test@deakin.edu.au

  // seedUsers and seedStaleReports each clear their own collections first, so every
  // test starts from the same data even if the test database was seeded before.
  beforeEach(async () => {
    await seed.seedUsers();
    await seed.seedStaleReports();
  });

  // Returns a supertest agent logged in as the given user.
  async function loginAs(email) {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email });
    return agent;
  }

  const adminAgent = () => loginAs(adminEmail);

  const send = (agent, { method, url, body }) =>
    body ? agent[method](url).send(body) : agent[method](url);

  const statusOf = async (Model, title) => (await Model.findOne({ title })).status;

  // Inserts an extra active found report with a custom createdAt (bypasses timestamps).
  async function insertFoundReport(title, daysOld, { withStatus = true } = {}) {
    const createdAt = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const { status, ...fields } = seed.sampleStaleFoundItems[0];
    await FoundItem.collection.insertOne({
      ...fields,
      ...(withStatus && { status }),
      title,
      createdAt,
      updatedAt: createdAt,
    });
  }

  describe('[SECURITY] Access Control', () => {
    ADMIN_ROUTES.forEach((route) => {
      const label = `${route.method.toUpperCase()} ${route.url}`;

      it(`TC-ADMIN-SEC-01: should return 401 for an unauthenticated ${label}`, async () => {
        const res = await send(request(app), route);

        expect(res.status).to.equal(401);
      });

      it(`TC-ADMIN-SEC-02: should return 403 for a non-admin ${label}`, async () => {
        const student = await loginAs(studentEmail);

        const res = await send(student, route);

        expect(res.status).to.equal(403);
        expect(res.body).to.deep.equal({ message: 'Admin access is required.' });
      });

      it(`TC-ADMIN-SEC-03: should return 200 for an admin ${label}`, async () => {
        const admin = await adminAgent();

        const res = await send(admin, route);

        expect(res.status).to.equal(200);
      });
    });

    it('TC-ADMIN-SEC-04: should not change any report when a non-admin runs a bulk action', async () => {
      const student = await loginAs(studentEmail);

      await student.post(BULK_URL).send({ action: 'resolve-stale' });

      expect(await statusOf(FoundItem, 'Stale Found Umbrella')).to.equal('active');
      expect(await statusOf(LostItem, 'Stale Lost Laptop Sleeve')).to.equal('active');
    });

    it('TC-ADMIN-SEC-05: should revoke admin access on the next request after logout', async () => {
      const admin = await adminAgent();
      expect((await admin.get(COUNT_URL)).status).to.equal(200);

      await admin.post('/api/auth/logout');
      const res = await admin.get(COUNT_URL);

      expect(res.status).to.equal(401);
    });
  });

  describe('[POSITIVE] Stale Count (GET /api/admin/reports/stale-count)', () => {
    it('TC-ADMIN-COUNT-01: should count only active reports older than 90 days', async () => {
      const admin = await adminAgent();

      const res = await admin.get(COUNT_URL);

      // Stale Found Umbrella + Stale Lost Laptop Sleeve. Resolved and fresh reports are excluded.
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ count: 2 });
    });

    it('TC-ADMIN-COUNT-02: should return 0 when there are no reports', async () => {
      await FoundItem.deleteMany({});
      await LostItem.deleteMany({});
      const admin = await adminAgent();

      const res = await admin.get(COUNT_URL);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ count: 0 });
    });

    it('TC-ADMIN-COUNT-03: should count a report at 91 days but not at 89 days', async () => {
      await insertFoundReport('Boundary 89 Days', 89);
      await insertFoundReport('Boundary 91 Days', 91);
      const admin = await adminAgent();

      const res = await admin.get(COUNT_URL);

      expect(res.body).to.deep.equal({ count: 3 });
    });

    it('TC-ADMIN-COUNT-04: should treat an old report with no status as active', async () => {
      await insertFoundReport('Legacy No Status', 120, { withStatus: false });
      const admin = await adminAgent();

      const res = await admin.get(COUNT_URL);

      expect(res.body).to.deep.equal({ count: 3 });
    });
  });

  describe('[POSITIVE] Stale Report List (GET /api/admin/reports/stale)', () => {
    it('TC-ADMIN-LIST-01: should list the stale reports oldest first with summary fields', async () => {
      const admin = await adminAgent();

      const res = await admin.get(STALE_URL);

      expect(res.status).to.equal(200);
      expect(res.body.reports.map((r) => r.title)).to.deep.equal([
        'Stale Lost Laptop Sleeve',
        'Stale Found Umbrella',
      ]);
      expect(res.body.reports.map((r) => r.type)).to.deep.equal(['lost', 'found']);
      expect(res.body.reports[0]).to.have.all.keys(
        'id',
        'type',
        'title',
        'category',
        'location',
        'createdAt',
      );
    });
  });

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

    it('TC-ADMIN-BULK-05: should remove resolved reports from the stale list and the browse feed', async () => {
      const admin = await adminAgent();

      await admin.post(BULK_URL).send({ action: 'resolve-stale' });
      const staleList = await admin.get(STALE_URL);
      const browse = await request(app).get('/api/items');

      expect(staleList.body).to.deep.equal({ reports: [] });
      const titles = browse.body.map((item) => item.title);
      expect(titles).to.not.include('Stale Found Umbrella');
      expect(titles).to.not.include('Stale Lost Laptop Sleeve');
      expect(titles).to.include.members(['Fresh Found Calculator', 'Recent Report Of An Old Loss']);
    });
  });

  describe('[BOUNDARY] Idempotency & Empty Runs', () => {
    it('TC-ADMIN-BULK-03: should resolve 0 reports on a second run', async () => {
      const admin = await adminAgent();

      const first = await admin.post(BULK_URL).send({ action: 'resolve-stale' });
      const second = await admin.post(BULK_URL).send({ action: 'resolve-stale' });

      expect(first.body).to.deep.equal({ count: 2 });
      expect(second.status).to.equal(200);
      expect(second.body).to.deep.equal({ count: 0 });
    });

    it('TC-ADMIN-BULK-06: should complete cleanly with 0 when there are no reports at all', async () => {
      await FoundItem.deleteMany({});
      await LostItem.deleteMany({});
      const admin = await adminAgent();

      const res = await admin.post(BULK_URL).send({ action: 'resolve-stale' });

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ count: 0 });
    });
  });

  describe('[TYPE & ENUM] Invalid Action', () => {
    it('TC-ADMIN-BULK-04: should reject an unknown action with 400 and change nothing', async () => {
      const admin = await adminAgent();

      const res = await admin.post(BULK_URL).send({ action: 'delete-everything' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Unknown bulk action. Supported actions: resolve-stale.');
      expect(await statusOf(FoundItem, 'Stale Found Umbrella')).to.equal('active');
    });

    it('TC-ADMIN-BULK-07: should reject a missing action with 400', async () => {
      const admin = await adminAgent();

      const res = await admin.post(BULK_URL).send({});

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Unknown bulk action. Supported actions: resolve-stale.');
    });

    it('TC-ADMIN-BULK-08: should reject a non-string action with 400', async () => {
      const admin = await adminAgent();

      const res = await admin.post(BULK_URL).send({ action: ['resolve-stale'] });

      expect(res.status).to.equal(400);
      expect(await statusOf(FoundItem, 'Stale Found Umbrella')).to.equal('active');
    });
  });

  describe('[ERROR HANDLING] Database Failures', () => {
    const failures = [
      { name: 'getStaleReportCount', method: 'get', url: COUNT_URL, message: 'Unable to get the stale report count.' },
      { name: 'getStaleReports', method: 'get', url: STALE_URL, message: 'Unable to get the stale reports.' },
      { name: 'runBulkAction', method: 'post', url: BULK_URL, body: { action: 'resolve-stale' }, message: 'Unable to run the bulk action.' },
    ];

    failures.forEach(({ name, message, ...route }) => {
      it(`TC-ADMIN-ERR-01: should return 500 when ${name} fails`, async () => {
        const original = adminService[name];
        adminService[name] = async () => {
          throw new Error('Private database details');
        };

        try {
          const admin = await adminAgent();
          const res = await send(admin, route);

          expect(res.status).to.equal(500);
          expect(res.body).to.deep.equal({ message });
        } finally {
          adminService[name] = original;
        }
      });
    });
  });
});
