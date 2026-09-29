"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const FoundItem = require("../../models/foundItem.model");
const LostItem = require("../../models/lostItem.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

// Only the owner can edit or resolve a report, and signing out removes access.
describe("Session-gated report actions integration", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const alice = seed.sampleUsers[0].email;
  const bob = seed.sampleUsers[1].email;

  const reports = [
    { type: "found", Model: FoundItem, id: String(seed.sampleFoundItems[0]._id) },
    { type: "lost", Model: LostItem, id: String(seed.sampleLostItems[0]._id) },
  ];

  async function loginAs(email) {
    const agent = request.agent(app);
    const response = await agent.post("/api/auth/login").send({ email });
    expect(response.status).to.equal(200);
    return agent;
  }

  function updateDetails(type) {
    return {
      title: `Updated ${type} report title`,
      category: "Other",
      date: "2026-09-05",
      description: `Updated description for the ${type} report.`,
      location: "Burwood, Building LC",
      handoverMethod: type === "found" ? "email" : null,
      collectionLocation: null,
    };
  }

  // Every owner-only action on one report.
  function ownerActions({ type, id }) {
    return {
      loadEdit: (agent) => agent.get(`/api/items/${type}/${id}/edit`),
      update: (agent) => agent.put(`/api/items/${type}/${id}`).send(updateDetails(type)),
      resolve: (agent) => agent.put(`/api/items/${type}/${id}/status`).send({ status: "resolved" }),
    };
  }

  const myReportIds = async (agent) => {
    const response = await agent.get("/api/items/mine");
    expect(response.status).to.equal(200);
    return [...response.body.found, ...response.body.lost].map((report) => report.id);
  };

  reports.forEach((report) => {
    const { type, Model, id } = report;
    const actions = ownerActions(report);

    it(`SESSION-INT-01: the owner can view, edit and resolve their own ${type} report`, async () => {
      const owner = await loginAs(alice);

      expect(await myReportIds(owner)).to.include(id);
      expect((await actions.loadEdit(owner)).status).to.equal(200);

      const update = await actions.update(owner);
      expect(update.status).to.equal(200);
      expect((await Model.findById(id)).title).to.equal(`Updated ${type} report title`);

      expect((await actions.resolve(owner)).status).to.equal(200);
      expect((await Model.findById(id)).status).to.equal("resolved");
    });

    it(`SESSION-INT-02: another user cannot see, edit or resolve the ${type} report`, async () => {
      const other = await loginAs(bob);
      const before = await Model.findById(id).lean();

      expect(await myReportIds(other)).to.not.include(id);
      expect((await actions.loadEdit(other)).status).to.equal(403);
      expect((await actions.update(other)).status).to.equal(403);
      expect((await actions.resolve(other)).status).to.equal(403);

      expect(await Model.findById(id).lean()).to.deep.equal(before);
    });

    it(`SESSION-INT-03: signing out removes access to the ${type} report's owner actions`, async () => {
      const owner = await loginAs(alice);
      expect((await actions.loadEdit(owner)).status).to.equal(200);
      const before = await Model.findById(id).lean();

      expect((await owner.post("/api/auth/logout")).status).to.equal(200);

      expect((await owner.get("/api/items/mine")).status).to.equal(401);
      expect((await actions.loadEdit(owner)).status).to.equal(401);
      expect((await actions.update(owner)).status).to.equal(401);
      expect((await actions.resolve(owner)).status).to.equal(401);
      expect(await Model.findById(id).lean()).to.deep.equal(before);
    });
  });

  it("SESSION-INT-04: a copied session cookie stops working after sign-out", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: alice });
    const cookie = login.headers["set-cookie"];
    const { type, id } = reports[0];

    const beforeLogout = await request(app).get(`/api/items/${type}/${id}/edit`).set("Cookie", cookie);
    expect(beforeLogout.status).to.equal(200);

    await request(app).post("/api/auth/logout").set("Cookie", cookie);

    const afterLogout = await request(app).get(`/api/items/${type}/${id}/edit`).set("Cookie", cookie);
    expect(afterLogout.status).to.equal(401);
  });

  it("SESSION-INT-05: signing back in restores the owner's access", async () => {
    const owner = await loginAs(alice);
    await owner.post("/api/auth/logout");
    expect((await owner.get("/api/items/mine")).status).to.equal(401);

    await owner.post("/api/auth/login").send({ email: alice });

    expect(await myReportIds(owner)).to.include(reports[0].id);
    expect((await ownerActions(reports[0]).loadEdit(owner)).status).to.equal(200);
  });
});
