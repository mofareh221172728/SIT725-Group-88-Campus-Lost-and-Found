'use strict';

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../server');
const FoundItem = require('../../models/foundItem.model');
const LostItem = require('../../models/lostItem.model');
const db = require('../helpers/db');
const seed = require('../helpers/seed');

describe('Integration - Session-Gated Report Actions', () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const ownerEmail = seed.sampleUsers[0].email; // alice.student@deakin.edu.au
  const otherEmail = seed.sampleUsers[1].email; // bob.staff@deakin.edu.au

  // alice owns the first found and lost seed report.
  const reports = [
    { type: 'found', Model: FoundItem, id: String(seed.sampleFoundItems[0]._id) },
    { type: 'lost', Model: LostItem, id: String(seed.sampleLostItems[0]._id) },
  ];

  // Returns a supertest agent with an active session for the given user.
  async function loginAs(email) {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email });
    expect(res.status).to.equal(200);
    return agent;
  }

  const getValidUpdate = (type) => ({
    title: `Updated ${type} report title`,
    category: 'Other',
    date: '2026-09-05',
    description: `Updated description for the ${type} report.`,
    location: 'Burwood, Building LC',
    handoverMethod: type === 'found' ? 'email' : null,
    collectionLocation: null,
  });

  const getValidFoundReport = () => ({
    type: 'found',
    title: 'Grey Umbrella',
    category: 'Other',
    date: '2026-09-05',
    location: 'Burwood, Library',
    description: 'Grey umbrella found near the library entrance.',
    handoverMethod: 'email',
  });

  // Every owner-only action on one report.
  const ownerActions = ({ type, id }) => ({
    loadEdit: (agent) => agent.get(`/api/items/${type}/${id}/edit`),
    update: (agent) => agent.put(`/api/items/${type}/${id}`).send(getValidUpdate(type)),
    resolve: (agent) => agent.put(`/api/items/${type}/${id}/status`).send({ status: 'resolved' }),
  });

  const myReportIds = async (agent) => {
    const res = await agent.get('/api/items/mine');
    expect(res.status).to.equal(200);
    return [...res.body.found, ...res.body.lost].map((report) => report.id);
  };

  describe('[POSITIVE] Owner Access', () => {
    reports.forEach((report) => {
      const { type, Model, id } = report;
      const actions = ownerActions(report);

      it(`TC-SESSION-01: should let the owner view, edit and resolve their own ${type} report`, async () => {
        const owner = await loginAs(ownerEmail);

        expect(await myReportIds(owner)).to.include(id);
        expect((await actions.loadEdit(owner)).status).to.equal(200);
        expect((await actions.update(owner)).status).to.equal(200);
        expect((await Model.findById(id)).title).to.equal(`Updated ${type} report title`);
        expect((await actions.resolve(owner)).status).to.equal(200);
        expect((await Model.findById(id)).status).to.equal('resolved');
      });
    });
  });

  describe('[SECURITY] Non-Owner Access', () => {
    reports.forEach((report) => {
      const { type, Model, id } = report;
      const actions = ownerActions(report);

      it(`TC-SESSION-02: should reject another user viewing, editing or resolving the ${type} report with 403`, async () => {
        const other = await loginAs(otherEmail);
        const before = await Model.findById(id).lean();

        expect(await myReportIds(other)).to.not.include(id);
        expect((await actions.loadEdit(other)).status).to.equal(403);
        expect((await actions.update(other)).status).to.equal(403);
        expect((await actions.resolve(other)).status).to.equal(403);
        expect(await Model.findById(id).lean()).to.deep.equal(before);
      });
    });
  });

  describe('[SESSION] Sign-out', () => {
    reports.forEach((report) => {
      const { type, Model, id } = report;
      const actions = ownerActions(report);

      it(`TC-SESSION-03: should reject every owner action on the ${type} report with 401 after sign-out`, async () => {
        const owner = await loginAs(ownerEmail);
        expect((await actions.loadEdit(owner)).status).to.equal(200);
        const before = await Model.findById(id).lean();

        expect((await owner.post('/api/auth/logout')).status).to.equal(200);

        expect((await owner.get('/api/items/mine')).status).to.equal(401);
        expect((await actions.loadEdit(owner)).status).to.equal(401);
        expect((await actions.update(owner)).status).to.equal(401);
        expect((await actions.resolve(owner)).status).to.equal(401);
        expect(await Model.findById(id).lean()).to.deep.equal(before);
      });
    });

    it('TC-SESSION-04: should reject a copied session cookie after sign-out', async () => {
      const login = await request(app).post('/api/auth/login').send({ email: ownerEmail });
      const cookie = login.headers['set-cookie'];
      const editUrl = `/api/items/${reports[0].type}/${reports[0].id}/edit`;

      expect((await request(app).get(editUrl).set('Cookie', cookie)).status).to.equal(200);

      await request(app).post('/api/auth/logout').set('Cookie', cookie);

      expect((await request(app).get(editUrl).set('Cookie', cookie)).status).to.equal(401);
    });

    it('TC-SESSION-05: should restore owner access after signing back in', async () => {
      const owner = await loginAs(ownerEmail);
      await owner.post('/api/auth/logout');
      expect((await owner.get('/api/items/mine')).status).to.equal(401);

      await owner.post('/api/auth/login').send({ email: ownerEmail });

      expect(await myReportIds(owner)).to.include(reports[0].id);
      expect((await ownerActions(reports[0]).loadEdit(owner)).status).to.equal(200);
    });

    it('TC-SESSION-06: should reject reporting a new item with 401 after sign-out', async () => {
      const user = await loginAs(ownerEmail);

      expect((await user.post('/api/items').send(getValidFoundReport())).status).to.equal(201);
      await user.post('/api/auth/logout');

      const res = await user.post('/api/items').send({ ...getValidFoundReport(), title: 'Second Umbrella' });

      expect(res.status).to.equal(401);
      expect(await FoundItem.countDocuments({ title: /Umbrella/ })).to.equal(1);
    });
  });
});
