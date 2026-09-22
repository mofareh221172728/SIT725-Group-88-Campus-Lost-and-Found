"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const User = require("../../models/user.model");
const FoundItem = require("../../models/foundItem.model");
const LostItem = require("../../models/lostItem.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Items Routes - Resolve own report", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  async function login(index = 0) {
    const agent = request.agent(app);
    const response = await agent.post("/api/auth/login")
      .send({ email: seed.sampleUsers[index].email });
    expect(response.status).to.equal(200);
    return agent;
  }

  for (const [type, Model, sample] of [
    ["found", FoundItem, seed.sampleFoundItems[0]],
    ["lost", LostItem, seed.sampleLostItems[0]],
  ]) {
    const id = String(sample._id);
    const url = `/api/items/${type}/${id}/status`;
    const resolve = (agent) => agent.put(url).send({ status: "resolved" });

    it(`resolves an owned ${type} report and removes it from Browse and counts`, async () => {
      const agent = await login();
      const before = await Model.findById(id).lean();
      const countsBefore = await agent.get("/api/items/counts");
      const response = await resolve(agent);
      expect(response.status).to.equal(200);
      expect(response.body.report).to.deep.equal({ id, type, status: "resolved" });
      const after = await Model.findById(id).lean();
      expect(after.status).to.equal("resolved");
      // Resolving must preserve all report details and ownership.
      delete before.status;
      delete before.updatedAt;
      delete after.status;
      delete after.updatedAt;
      expect(after).to.deep.equal(before);
      const browse = await agent.get("/api/items");
      expect(browse.status).to.equal(200);
      expect(browse.body.some((item) => item.id === id)).to.equal(false);
      const countsAfter = await agent.get("/api/items/counts");
      expect(countsAfter.body.all).to.equal(countsBefore.body.all - 1);
      expect(countsAfter.body[type]).to.equal(countsBefore.body[type] - 1);
    });

    it(`rejects an unsigned request for a ${type} report`, async () => {
      expect((await resolve(request(app))).status).to.equal(401);
      expect((await Model.findById(id)).status).to.equal("active");
    });

    it(`rejects a non-owner, including an admin, for a ${type} report`, async () => {
      const other = await login(1);
      expect((await resolve(other)).status).to.equal(403);
      await User.updateOne({ _id: seed.testUserIds.bob }, { $set: { role: "admin" } });
      expect((await resolve(other)).status).to.equal(403);
      expect((await Model.findById(id)).status).to.equal("active");
    });

    it(`returns 404 for a missing ${type} report`, async () => {
      const agent = await login();
      const response = await agent.put(`/api/items/${type}/650000000000000000000999/status`)
        .send({ status: "resolved" });
      expect(response.status).to.equal(404);
    });

    it(`resolves a legacy ${type} report with no stored status`, async () => {
      const agent = await login();
      await Model.collection.updateOne({ _id: sample._id }, { $unset: { status: "" } });
      expect((await resolve(agent)).status).to.equal(200);
      expect((await Model.findById(id)).status).to.equal("resolved");
    });

    it(`rejects repeated resolution and reopening for a ${type} report`, async () => {
      const agent = await login();
      expect((await resolve(agent)).status).to.equal(200);
      expect((await resolve(agent)).status).to.equal(409);
      const reopen = await agent.put(url).send({ status: "active" });
      expect(reopen.status).to.equal(400);
      expect((await Model.findById(id)).status).to.equal("resolved");
    });

    it(`allows only one of two simultaneous resolve requests for a ${type} report`, async () => {
      const agent = await login();
      const responses = await Promise.all([resolve(agent), resolve(agent)]);
      expect(responses.map((response) => response.status).sort()).to.deep.equal([200, 409]);
      expect((await Model.findById(id)).status).to.equal("resolved");
    });

    it(`rejects a deleted user's session for a ${type} report`, async () => {
      const agent = await login();
      await User.deleteOne({ _id: seed.testUserIds.alice });
      expect((await resolve(agent)).status).to.equal(401);
      expect((await Model.findById(id)).status).to.equal("active");
    });
  }

  const foundId = String(seed.sampleFoundItems[0]._id);
  const foundUrl = `/api/items/found/${foundId}/status`;

  for (const [name, url, body] of [
    ["invalid type", `/api/items/other/${foundId}/status`, { status: "resolved" }],
    ["invalid ID", "/api/items/found/not-an-id/status", { status: "resolved" }],
    ["missing status", foundUrl, {}],
    ["active status", foundUrl, { status: "active" }],
    ["unsupported status", foundUrl, { status: "archived" }],
    ["extra report fields", foundUrl, {
      status: "resolved", ownerId: String(seed.testUserIds.bob), title: "Changed title",
    }],
  ]) {
    it(`rejects ${name} without changing a report`, async () => {
      const agent = await login();
      const before = await FoundItem.findById(foundId).lean();
      expect((await agent.put(url).send(body)).status).to.equal(400);
      expect(await FoundItem.findById(foundId).lean()).to.deep.equal(before);
    });
  }

  it("rejects a missing request body", async () => {
    const agent = await login();
    expect((await agent.put(foundUrl)).status).to.equal(400);
    expect((await FoundItem.findById(foundId)).status).to.equal("active");
  });

  it("returns a safe error if the database update fails", async () => {
    const agent = await login();
    const original = FoundItem.findOneAndUpdate;
    FoundItem.findOneAndUpdate = async () => { throw new Error("Private database details"); };
    try {
      const response = await agent.put(foundUrl).send({ status: "resolved" });
      expect(response.status).to.equal(500);
      expect(response.body).to.deep.equal({ message: "Unable to resolve report." });
      expect((await FoundItem.findById(foundId)).status).to.equal("active");
    } finally {
      FoundItem.findOneAndUpdate = original;
    }
  });
});
