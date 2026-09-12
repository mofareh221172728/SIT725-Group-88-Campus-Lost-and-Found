'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
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
