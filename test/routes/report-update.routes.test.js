"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const FoundItem = require("../../models/foundItem.model");
const LostItem = require("../../models/lostItem.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Items Routes - Update own report details", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  async function login(index = 0) {
    const agent = request.agent(app);
    const response = await agent
      .post("/api/auth/login")
      .send({ email: seed.sampleUsers[index].email });
    expect(response.status).to.equal(200);
    return agent;
  }

  const foundId = String(seed.sampleFoundItems[0]._id);
  const lostId = String(seed.sampleLostItems[0]._id);

  function foundDetails() {
    return {
      title: "  Updated Blue Bottle  ",
      category: "  Bottles & Containers  ",
      date: "2026-09-05",
      description: "  Updated description for the blue water bottle.  ",
      location: "  Burwood, Building LC  ",
      handoverMethod: "dropoff",
      collectionLocation: "  Burwood Security Desk  ",
    };
  }

  function lostDetails() {
    return {
      title: "Updated Black Wallet",
      category: "Cards & Wallets",
      date: "2026-09-06",
      description: "Updated description for the missing black wallet.",
      location: "Waterfront, Building D",
      handoverMethod: null,
      collectionLocation: null,
    };
  }

  it("updates and sanitises an owned Found report", async () => {
    const agent = await login();
    const response = await agent
      .put(`/api/items/found/${foundId}`)
      .send(foundDetails());

    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Report updated successfully.");
    expect(response.body.report).to.include({
      title: "Updated Blue Bottle",
      category: "Bottles & Containers",
      description: "Updated description for the blue water bottle.",
      campusLocation: "Burwood, Building LC",
      contactMethod: "collection",
      collectionLocation: "Burwood Security Desk",
    });

    const report = await FoundItem.findById(foundId).lean();
    expect(report.ownerId.toString()).to.equal(String(seed.testUserIds.alice));
    expect(report.status).to.equal("active");
    expect(report.photos).to.deep.equal(seed.sampleFoundItems[0].photos);
  });

  it("updates an owned Lost report without changing protected fields", async () => {
    const agent = await login();
    const response = await agent
      .put(`/api/items/lost/${lostId}`)
      .send(lostDetails());

    expect(response.status).to.equal(200);
    expect(response.body.report).to.include({
      title: lostDetails().title,
      campusLocation: lostDetails().location,
    });

    const report = await LostItem.findById(lostId).lean();
    expect(report.ownerId.toString()).to.equal(String(seed.testUserIds.alice));
    expect(report.status).to.equal("active");
    expect(report.photos).to.deep.equal(seed.sampleLostItems[0].photos);
  });

  it("removes a stale collection location when handover changes to email", async () => {
    const agent = await login(1);
    const bobFoundId = String(seed.sampleFoundItems[1]._id);
    const response = await agent
      .put(`/api/items/found/${bobFoundId}`)
      .send({
        ...foundDetails(),
        handoverMethod: "email",
        collectionLocation: "This value must not be saved",
      });

    expect(response.status).to.equal(200);
    const report = await FoundItem.findById(bobFoundId).lean();
    expect(report.contactMethod).to.equal("email");
    expect(report).not.to.have.property("collectionLocation");
  });

  it("rejects an unauthenticated update", async () => {
    const response = await request(app)
      .put(`/api/items/found/${foundId}`)
      .send(foundDetails());

    expect(response.status).to.equal(401);
    expect(response.body.message).to.equal("Authentication is required.");
  });

  it("rejects a non-owner without changing the report", async () => {
    const agent = await login(1);
    const before = await FoundItem.findById(foundId).lean();
    const response = await agent
      .put(`/api/items/found/${foundId}`)
      .send(foundDetails());

    expect(response.status).to.equal(403);
    expect(response.body.message).to.equal(
      "Only the report owner can update its details.",
    );
    expect(await FoundItem.findById(foundId).lean()).to.deep.equal(before);
  });

  it("returns 404 for a missing report", async () => {
    const agent = await login();
    const response = await agent
      .put("/api/items/found/650000000000000000000999")
      .send(foundDetails());

    expect(response.status).to.equal(404);
    expect(response.body.message).to.equal("Report was not found.");
  });

  for (const [name, url, body] of [
    ["empty body", `/api/items/found/${foundId}`, {}],
    ["invalid type", `/api/items/other/${foundId}`, foundDetails()],
    ["invalid ID", "/api/items/found/not-an-id", foundDetails()],
    [
      "invalid calendar date",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), date: "2026-02-30" },
    ],
    [
      "future date",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), date: "2099-01-01" },
    ],
    [
      "short title",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), title: "abc" },
    ],
    [
      "long title",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), title: "a".repeat(101) },
    ],
    [
      "short description",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), description: "short" },
    ],
    [
      "long description",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), description: "a".repeat(1001) },
    ],
    [
      "invalid handover method",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), handoverMethod: "phone" },
    ],
    [
      "missing collection location",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), collectionLocation: " " },
    ],
    [
      "protected field",
      `/api/items/found/${foundId}`,
      { ...foundDetails(), ownerId: String(seed.testUserIds.bob) },
    ],
  ]) {
    it(`rejects ${name} without changing the report`, async () => {
      const agent = await login();
      const before = await FoundItem.findById(foundId).lean();
      const response = await agent.put(url).send(body);

      expect(response.status).to.equal(400);
      expect(await FoundItem.findById(foundId).lean()).to.deep.equal(before);
    });
  }

  it("returns a safe error if the database update fails", async () => {
    const agent = await login();
    const original = FoundItem.findOneAndUpdate;
    FoundItem.findOneAndUpdate = async () => {
      throw new Error("Private database details");
    };

    try {
      const response = await agent
        .put(`/api/items/found/${foundId}`)
        .send(foundDetails());

      expect(response.status).to.equal(500);
      expect(response.body).to.deep.equal({
        message: "Unable to update report.",
      });
    } finally {
      FoundItem.findOneAndUpdate = original;
    }
  });
});
