"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Create Report item API integration", () => {
  const seededEmail = seed.sampleUsers[0].email;

  before(db.connect);
  beforeEach(seed.seedUsers);
  afterEach(db.clearCollections);
  after(db.disconnect);

  async function authenticatedAgent() {
    const agent = request.agent(app);
    const loginResponse = await agent
      .post("/api/auth/login")
      .send({ email: seededEmail });

    expect(loginResponse.status).to.equal(200);
    return agent;
  }

  function validFoundReport() {
    return {
      type: "found",
      title: "Blue Water Bottle",
      category: "Bottles & Containers",
      date: "2026-09-01",
      location: "Burwood, Building LC, Level 2",
      description: "Blue metal bottle handed to the campus security desk.",
      handoverMethod: "dropoff",
      collectionLocation: "Burwood Campus Security Desk",
    };
  }

  function validLostReport() {
    return {
      type: "lost",
      title: "Black Leather Wallet",
      category: "Cards & Wallets",
      date: "2026-09-02",
      location: "Waurn Ponds, Building LA",
      description: "Black wallet containing a student card and driver licence.",
      handoverMethod: null,
      collectionLocation: null,
    };
  }

  it("creates a Found report and retrieves it through the list API", async () => {
    const agent = await authenticatedAgent();
    const payload = validFoundReport();

    const createResponse = await agent.post("/api/items").send(payload);

    expect(createResponse.status).to.equal(201);
    expect(createResponse.body.message).to.equal("Report created successfully.");
    expect(createResponse.body.report).to.include({
      title: payload.title,
      category: payload.category,
      campusLocation: payload.location,
      contactMethod: "collection",
      collectionLocation: payload.collectionLocation,
      status: "active",
    });

    const listResponse = await agent.get("/api/items?type=found&sort=newest");

    expect(listResponse.status).to.equal(200);
    expect(listResponse.body).to.have.length(1);
    expect(listResponse.body[0]).to.include({
      type: "found",
      title: payload.title,
      category: payload.category,
      location: payload.location,
      status: "active",
    });
    expect(listResponse.body[0].id).to.equal(createResponse.body.report._id);
  });

  it("creates a Lost report and retrieves it through the list API", async () => {
    const agent = await authenticatedAgent();
    const payload = validLostReport();

    const createResponse = await agent.post("/api/items").send(payload);
    const listResponse = await agent.get("/api/items?type=lost");

    expect(createResponse.status).to.equal(201);
    expect(listResponse.status).to.equal(200);
    expect(listResponse.body).to.have.length(1);
    expect(listResponse.body[0]).to.include({
      type: "lost",
      title: payload.title,
      location: payload.location,
      status: "active",
    });
  });

  for (const field of [
    "type",
    "title",
    "category",
    "date",
    "location",
    "description",
  ]) {
    it(`rejects a report missing the required ${field} field`, async () => {
      const agent = await authenticatedAgent();
      const payload = validFoundReport();
      delete payload[field];

      const response = await agent.post("/api/items").send(payload);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal(
        "All required fields must be provided.",
      );
    });
  }

  it("rejects an invalid report type", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/items")
      .send({ ...validFoundReport(), type: "misplaced" });

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal(
      'Type must be either "lost" or "found".',
    );
  });

  it("rejects an invalid report date", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/items")
      .send({ ...validFoundReport(), date: "not-a-date" });

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal("A valid date must be provided.");
  });

  it("rejects a Found report without a handover method", async () => {
    const agent = await authenticatedAgent();
    const payload = validFoundReport();
    delete payload.handoverMethod;

    const response = await agent.post("/api/items").send(payload);

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal(
      'Found items must provide handoverMethod as "email" or "dropoff".',
    );
  });

  it("rejects a dropped-off Found report without a collection location", async () => {
    const agent = await authenticatedAgent();
    const payload = validFoundReport();
    delete payload.collectionLocation;

    const response = await agent.post("/api/items").send(payload);

    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal(
      "collectionLocation is required when handoverMethod is dropoff.",
    );
  });

  it("rejects an unauthenticated report submission", async () => {
    const response = await request(app).post("/api/items").send(validLostReport());

    expect(response.status).to.equal(401);
    expect(response.body.message).to.equal("Authentication is required.");
  });
});
