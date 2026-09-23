'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
const FoundItem = require('../../models/foundItem.model');
const LostItem = require('../../models/lostItem.model');
const db = require('../helpers/db');
const seed = require('../helpers/seed');

describe('Items Routes - Create Report (POST /api/items)', () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const seededEmail = seed.sampleUsers[0].email; // alice.student@deakin.edu.au

  // Returns a supertest agent with an active authenticated session.
  async function authenticatedAgent() {
    await seed.seedUsers();
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: seededEmail });
    return agent;
  }

  const getValidFoundReport = () => ({
    type: 'found',
    title: 'Blue Water Bottle',
    category: 'Bottles & Containers',
    date: '2026-09-01',
    location: 'Burwood, Library Level 2',
    description: 'Stainless steel bottle found near the library entrance.',
    handoverMethod: 'email',
  });

  const getValidLostReport = () => ({
    type: 'lost',
    title: 'Black Leather Wallet',
    category: 'Cards & Wallets',
    date: '2026-09-02',
    location: 'Waurn Ponds, Building LA',
    description: 'Bi-fold wallet with student ID, lost near the cafeteria.',
  });

  describe('[POSITIVE] Valid Report Creation', () => {
    it('TC-API-CREATE-01: should create a Found report and return 201 with the persisted report', async () => {
      const agent = await authenticatedAgent();
      const payload = getValidFoundReport();

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Report created successfully.');
      expect(res.body.report).to.exist;
      expect(res.body.report._id).to.exist;
      expect(res.body.report.title).to.equal(payload.title);
      expect(res.body.report.category).to.equal(payload.category);
      expect(res.body.report.campusLocation).to.equal(payload.location);
      expect(res.body.report.contactMethod).to.equal('email');
      expect(res.body.report.status).to.equal('active');
    });

    it('TC-API-CREATE-02: should create a Lost report and return 201 with the persisted report', async () => {
      const agent = await authenticatedAgent();
      const payload = getValidLostReport();

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Report created successfully.');
      expect(res.body.report).to.exist;
      expect(res.body.report._id).to.exist;
      expect(res.body.report.title).to.equal(payload.title);
      expect(res.body.report.campusLocation).to.equal(payload.location);
      expect(res.body.report.status).to.equal('active');
    });
  });

  describe('[REQUIRED] Mandatory Field Validation', () => {
    const requiredFields = ['type', 'title', 'category', 'date', 'location', 'description'];

    requiredFields.forEach((field) => {
      it(`TC-API-CREATE-03-${field}: should reject a report missing "${field}" with 400`, async () => {
        const agent = await authenticatedAgent();
        const payload = getValidFoundReport();
        delete payload[field];

        const res = await agent.post('/api/items').send(payload);

        expect(res.status).to.equal(400);
        expect(res.body.message).to.equal('All required fields must be provided.');
      });
    });

    it('TC-API-CREATE-04: should reject a completely empty body with 400', async () => {
      const agent = await authenticatedAgent();

      const res = await agent.post('/api/items').send({});

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('All required fields must be provided.');
    });
  });

  describe('[TYPE & ENUM] Report Type Validation', () => {
    it('TC-API-CREATE-03-type: should reject an invalid type value with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = { ...getValidFoundReport(), type: 'misplaced' };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Type must be either "lost" or "found".');
    });
  });

  describe('[TEMPORAL] Date Validation', () => {
    it('TC-API-CREATE-05: should reject a future date with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = { ...getValidFoundReport(), date: '2099-01-01' };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Report date cannot be in the future.');
    });

    it('TC-API-CREATE-06: should reject an invalid date string with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = { ...getValidFoundReport(), date: 'not-a-date' };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('A valid date must be provided.');
    });
  });

  describe('[CONDITIONAL] Found-Item Handover Logic', () => {
    it('TC-API-CREATE-07: should reject a Found report with a missing handoverMethod with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = getValidFoundReport();
      delete payload.handoverMethod;

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Found items must provide handoverMethod as "email" or "dropoff".');
    });

    it('TC-API-CREATE-08: should reject a Found report with an invalid handoverMethod with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = { ...getValidFoundReport(), handoverMethod: 'phone' };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Found items must provide handoverMethod as "email" or "dropoff".');
    });

    it('TC-API-CREATE-09: should reject a Found dropoff report without collectionLocation with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = { ...getValidFoundReport(), handoverMethod: 'dropoff' };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('collectionLocation is required when handoverMethod is dropoff.');
    });

    it('TC-API-CREATE-08b: should create a Found dropoff report with a valid collectionLocation and return 201', async () => {
      const agent = await authenticatedAgent();
      const payload = {
        ...getValidFoundReport(),
        handoverMethod: 'dropoff',
        collectionLocation: 'Burwood Campus Security Desk',
      };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.report.contactMethod).to.equal('collection');
      expect(res.body.report.collectionLocation).to.equal(payload.collectionLocation);
    });
  });

  describe('[AUTHENTICATION] Auth-Gated Access', () => {
    it('TC-API-CREATE-10: should reject an unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/items')
        .send(getValidFoundReport());

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Authentication is required.');
    });
  });

  describe('[BOUNDARY] Photo Array Constraints (0–3 photos)', () => {
    it('TC-API-CREATE-11: should accept a Found report with exactly 3 photos and return 201', async () => {
      const agent = await authenticatedAgent();
      const payload = {
        ...getValidFoundReport(),
        photos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
          'https://example.com/photo3.jpg',
        ],
      };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.report.photos).to.have.lengthOf(3);
    });

    it('TC-API-CREATE-12: should reject a report with 4 photos with 400', async () => {
      const agent = await authenticatedAgent();
      const payload = {
        ...getValidFoundReport(),
        photos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg',
          'https://example.com/photo3.jpg',
          'https://example.com/photo4.jpg',
        ],
      };

      const res = await agent.post('/api/items').send(payload);

      expect(res.status).to.equal(400);
    });
  });
});

describe('Items Routes - Browse Active Reports (GET /api/items, GET /api/items/counts)', () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  describe('[POSITIVE] Active Report Listing', () => {
    it('TC-API-GET-01: should return combined active found and lost reports with card response fields', async () => {
      const res = await request(app).get('/api/items?type=all');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(3);
      expect(res.body.map((item) => item.type).sort()).to.deep.equal(['found', 'found', 'lost']);
      expect(res.body[0]).to.have.all.keys(
        'id',
        'type',
        'title',
        'category',
        'location',
        'date',
        'photos',
        'status',
      );
    });

    it('TC-API-GET-02: should default to type "all" when no type query param is provided', async () => {
      const res = await request(app).get('/api/items');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(3);
    });

    it('TC-API-GET-03: should return only found reports for type=found', async () => {
      const res = await request(app).get('/api/items?type=found');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(2);
      expect(res.body.every((item) => item.type === 'found')).to.equal(true);
    });

    it('TC-API-GET-04: should return only lost reports for type=lost', async () => {
      const res = await request(app).get('/api/items?type=lost');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(1);
      expect(res.body[0].type).to.equal('lost');
    });
  });

  describe('[SEARCH] Keyword Filter', () => {
    it('TC-API-SEARCH-01: should find active reports by keyword in the title', async () => {
      const res = await request(app).get('/api/items?keyword=wallet');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(1);
      expect(res.body[0].title).to.equal('Black Leather Bi-fold Wallet');
    });

    it('TC-API-SEARCH-07: should find a found report by a keyword only in its description', async () => {
      const res = await request(app).get('/api/items').query({
        keyword: '  STICKER  ',
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(1);
      expect(res.body[0].type).to.equal('found');
      expect(res.body[0].title).to.equal('Blue Hydro Flask Water Bottle');
      expect(res.body[0]).not.to.have.property('description');
    });

    it('TC-API-SEARCH-08: should find a lost report by a keyword only in its description', async () => {
      const res = await request(app).get('/api/items').query({
        keyword: '  LICENSE  ',
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(1);
      expect(res.body[0].type).to.equal('lost');
      expect(res.body[0].title).to.equal('Black Leather Bi-fold Wallet');
      expect(res.body[0]).not.to.have.property('description');
    });
  });
  describe('[FILTERS] Category, Location and Date Range', () => {
    it('TC-API-FILTER-01: should filter by category', async () => {
      const res = await request(app).get('/api/items?category=electronics');

      expect(res.status).to.equal(200);
      expect(res.body.map((item) => item.title)).to.deep.equal([
        'Graphing Calculator TI-84',
      ]);
    });

    it('TC-API-FILTER-02: should filter by campus location', async () => {
      const res = await request(app).get('/api/items?location=burwood');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(2);
      expect(
        res.body.every((item) => item.location === 'Burwood'),
      ).to.equal(true);
    });

    it('TC-API-FILTER-03: should use an inclusive date range', async () => {
      const res = await request(app).get(
        '/api/items?fromDate=2026-09-02&toDate=2026-09-03&sort=oldest',
      );

      expect(res.status).to.equal(200);
      expect(res.body.map((item) => item.title)).to.deep.equal([
        'Graphing Calculator TI-84',
        'Black Leather Bi-fold Wallet',
      ]);
    });

    it('TC-API-FILTER-04: should combine category, location, and date filters', async () => {
      const res = await request(app).get(
        '/api/items?type=found&category=Electronics&location=Waurn%20Ponds&fromDate=2026-09-02&toDate=2026-09-02',
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(1);
      expect(res.body[0].title).to.equal('Graphing Calculator TI-84');
    });
  });
  describe('[SEARCH] Empty, No-result and Date Validation', () => {
    it('TC-API-SEARCH-02: should return an empty array when nothing matches', async () => {
      const res = await request(app).get(
        '/api/items?keyword=no-such-item',
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal([]);
    });

    it('TC-API-SEARCH-03: should ignore empty filter parameters', async () => {
      const res = await request(app).get(
        '/api/items?keyword=&category=&location=&fromDate=&toDate=',
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(3);
    });

    it('TC-API-SEARCH-04: should reject an invalid date format', async () => {
      const res = await request(app).get(
        '/api/items?fromDate=not-a-date',
      );

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal(
        'fromDate must be a valid date in YYYY-MM-DD format.',
      );
    });

    it('TC-API-SEARCH-05: should reject an invalid calendar date', async () => {
      const res = await request(app).get(
        '/api/items?fromDate=2026-02-30',
      );

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal(
        'fromDate must be a valid date in YYYY-MM-DD format.',
      );
    });

    it('TC-API-SEARCH-06: should reject a reversed date range', async () => {
      const res = await request(app).get(
        '/api/items?fromDate=2026-09-04&toDate=2026-09-01',
      );

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal(
        'fromDate cannot be after toDate.',
      );
    });
  });

  describe('[TYPE & ENUM] Unrecognised Type Query', () => {
    it('TC-API-GET-05: should return an empty list for a type value that is neither "found" nor "lost" nor "all"', async () => {
      const res = await request(app).get('/api/items?type=misplaced');

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal([]);
    });
  });

  describe('[CONDITIONAL] Active-Status Filtering', () => {
    it('TC-API-GET-06: should treat a legacy report with no status field as active', async () => {
      await LostItem.collection.insertOne({
        ownerId: seed.testUserIds.alice,
        title: 'Legacy Lost Item',
        category: 'Other',
        description: 'Created before report statuses were introduced',
        lostAt: new Date('2026-08-31T09:00:00.000Z'),
        campusLocation: 'Waterfront',
        photos: [],
      });

      const res = await request(app).get('/api/items?type=lost');

      expect(res.status).to.equal(200);
      expect(res.body).to.have.length(2);
      expect(res.body.find((item) => item.title === 'Legacy Lost Item')).to.include({
        type: 'lost',
        status: 'active',
        location: 'Waterfront',
      });
    });

    it('TC-API-GET-07: should exclude reports with status "resolved"', async () => {
      const res = await request(app).get('/api/items?type=lost');

      expect(res.status).to.equal(200);
      expect(res.body.map((item) => item.title)).to.not.include('Wireless Noise Cancelling Earbuds');
    });
  });

  describe('[POSITIVE] Sorting', () => {
    it('TC-API-GET-08: should sort by newest date first when sort=newest', async () => {
      const res = await request(app).get('/api/items?type=all&sort=newest');

      expect(res.status).to.equal(200);
      expect(res.body[0].title).to.equal('Black Leather Bi-fold Wallet');
      expect(res.body[2].title).to.equal('Blue Hydro Flask Water Bottle');
    });

    it('TC-API-GET-09: should sort by oldest date first when sort=oldest', async () => {
      const res = await request(app).get('/api/items?type=all&sort=oldest');

      expect(res.status).to.equal(200);
      expect(res.body[0].title).to.equal('Blue Hydro Flask Water Bottle');
      expect(res.body[2].title).to.equal('Black Leather Bi-fold Wallet');
    });
  });

  describe('[BOUNDARY] Pagination', () => {
    it('TC-API-GET-10: should return the first page slice with the requested page size', async () => {
      const res = await request(app).get('/api/items?type=all&sort=oldest&page=1&limit=2');

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ total: 3, page: 1, totalPages: 2 });
      expect(res.body.items).to.have.length(2);
      expect(res.body.items.map((item) => item.title)).to.deep.equal([
        'Blue Hydro Flask Water Bottle',
        'Graphing Calculator TI-84',
      ]);
    });

    it('TC-API-GET-11: should return the remaining items on the last page', async () => {
      const res = await request(app).get('/api/items?type=all&sort=oldest&page=2&limit=2');

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ total: 3, page: 2, totalPages: 2 });
      expect(res.body.items).to.have.length(1);
      expect(res.body.items[0].title).to.equal('Black Leather Bi-fold Wallet');
    });

    it('TC-API-GET-12: should return an empty items array for a page beyond the last page', async () => {
      const res = await request(app).get('/api/items?type=all&limit=2&page=5');

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ total: 3, page: 5, totalPages: 2 });
      expect(res.body.items).to.have.length(0);
    });

    it('TC-API-GET-13: should fall back to page 1 / limit 12 for non-numeric page and limit values', async () => {
      const res = await request(app).get('/api/items?type=all&page=abc&limit=xyz');

      expect(res.status).to.equal(200);
      expect(res.body).to.include({ total: 3, page: 1, totalPages: 1 });
      expect(res.body.items).to.have.length(3);
    });
  });

  describe('[ERROR HANDLING] Database Failures', () => {
    it('TC-API-GET-14: should return 500 if the database throws while listing items', async () => {
      const originalFind = FoundItem.find;
      const originalConsoleError = console.error;
      FoundItem.find = () => { throw new Error('Simulated database failure'); };
      console.error = () => {};

      let res;
      try {
        res = await request(app).get('/api/items');
      } finally {
        FoundItem.find = originalFind;
        console.error = originalConsoleError;
      }

      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal('Unable to get items.');
    });
  });

  describe('[POSITIVE] Report Counts', () => {
    it('TC-API-COUNTS-01: should return active report counts split by found and lost, excluding resolved reports', async () => {
      const res = await request(app).get('/api/items/counts');

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ all: 3, found: 2, lost: 1 });
    });
  });

  describe('[ERROR HANDLING] Database Failures - Counts', () => {
    it('TC-API-COUNTS-02: should return 500 if the database throws while counting items', async () => {
      const originalCount = FoundItem.countDocuments;
      const originalConsoleError = console.error;
      FoundItem.countDocuments = () => { throw new Error('Simulated database failure'); };
      console.error = () => {};

      let res;
      try {
        res = await request(app).get('/api/items/counts');
      } finally {
        FoundItem.countDocuments = originalCount;
        console.error = originalConsoleError;
      }

      expect(res.status).to.equal(500);
      expect(res.body.message).to.equal('Unable to get item counts.');
    });
  });
});

describe('Items Routes - Item Detail (GET /api/items/:id)', () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  it('returns an active Found email-contact report', async () => {
    const report = seed.sampleFoundItems[0];
    const res = await request(app).get(`/api/items/${report._id}?type=found`);

    expect(res.status).to.equal(200);
    expect(res.body.report).to.include({
      id: String(report._id),
      type: 'found',
      title: report.title,
      category: report.category,
      description: report.description,
      location: report.campusLocation,
      status: 'active',
      contactMethod: 'email',
      contactEmail: seed.sampleUsers[0].email,
    });
    expect(res.body.report.date).to.equal(report.foundAt.toISOString());
    expect(res.body.report.reportedDate).to.be.a('string');
    expect(res.body.report.photos).to.deep.equal(report.photos);
  });

  it('returns collection information for an active Found report', async () => {
    const report = seed.sampleFoundItems[1];
    const res = await request(app).get(`/api/items/${report._id}?type=found`);

    expect(res.status).to.equal(200);
    expect(res.body.report).to.include({
      contactMethod: 'collection',
      collectionLocation: report.collectionLocation,
    });
    expect(res.body.report).not.to.have.property('contactEmail');
  });

  it('returns an active Lost report without Found contact fields', async () => {
    const report = seed.sampleLostItems[0];
    const res = await request(app).get(`/api/items/${report._id}?type=lost`);

    expect(res.status).to.equal(200);
    expect(res.body.report).to.include({
      id: String(report._id),
      type: 'lost',
      title: report.title,
      description: report.description,
      location: report.campusLocation,
    });
    expect(res.body.report.date).to.equal(report.lostAt.toISOString());
    expect(res.body.report).not.to.have.property('contactMethod');
  });

  it('returns no more than three photos', async () => {
    const report = seed.sampleFoundItems[0];
    const photos = ['one.jpg', 'two.jpg', 'three.jpg'];
    await FoundItem.findByIdAndUpdate(report._id, { photos });

    const res = await request(app).get(`/api/items/${report._id}?type=found`);

    expect(res.status).to.equal(200);
    expect(res.body.report.photos).to.deep.equal(photos);
  });

  it('returns 404 for resolved, missing, or invalid report IDs', async () => {
    const resolved = await request(app).get(
      `/api/items/${seed.sampleLostItems[1]._id}?type=lost`,
    );
    const missing = await request(app).get(
      '/api/items/650000000000000000000999?type=found',
    );
    const invalid = await request(app).get('/api/items/not-an-id?type=found');

    expect(resolved.status).to.equal(404);
    expect(missing.status).to.equal(404);
    expect(invalid.status).to.equal(404);
  });

  it('requires type to identify the report collection', async () => {
    const reportId = seed.sampleFoundItems[0]._id;
    const missing = await request(app).get(`/api/items/${reportId}`);
    const invalid = await request(app).get(`/api/items/${reportId}?type=other`);

    expect(missing.status).to.equal(400);
    expect(invalid.status).to.equal(400);
    expect(missing.body.message).to.equal('type must be either "found" or "lost".');
  });
});
