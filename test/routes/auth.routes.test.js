'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
const db = require('../helpers/db');
const seed = require('../helpers/seed');

describe('Auth Routes - Login, Session & Sign-out', () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const seededEmail = seed.sampleUsers[0].email;

  beforeEach(async () => {
    await seed.seedUsers();
  });

  describe('[AUTHENTICATION] POST /api/auth/login', () => {
    it('TC-AUTH-04: should log in with a valid seeded test account and start a session', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: seededEmail });

      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal(seededEmail);
      expect(res.headers['set-cookie']).to.exist;
    });

    it('TC-AUTH-05a: should reject an unregistered email with 401 and no session', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown.user@deakin.edu.au' });

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Mock user was not found.');
      expect(res.headers['set-cookie']).to.not.exist;
    });

    it('TC-AUTH-05b: should reject a missing email with 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).to.equal(400);
      expect(res.body.message).to.equal('Email is required.');
    });
  });

  describe('[SESSION] GET /api/auth/me', () => {
    it('TC-AUTH-06: should return the current user identity while the session is active', async () => {
      const agent = request.agent(app);

      await agent.post('/api/auth/login').send({ email: seededEmail });

      const res = await agent.get('/api/auth/me');

      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal(seededEmail);
    });
  });

  describe('[SECURITY] Protected Route Access', () => {
    it('TC-AUTH-07: should reject GET /api/auth/me with 401 when no session exists', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).to.equal(401);
      expect(res.body.message).to.equal('Authentication is required.');
    });
  });

  describe('[SESSION] POST /api/auth/logout', () => {
    it('TC-AUTH-08: should destroy the session on sign-out and revoke further access', async () => {
      const agent = request.agent(app);

      await agent.post('/api/auth/login').send({ email: seededEmail });

      const logoutRes = await agent.post('/api/auth/logout');
      expect(logoutRes.status).to.equal(200);
      expect(logoutRes.body.message).to.equal('Logout successful.');

      const meRes = await agent.get('/api/auth/me');
      expect(meRes.status).to.equal(401);
    });
  });
});
