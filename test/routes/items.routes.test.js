"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const LostItem = require("../../models/lostItem.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("Item Routes - Active report listing", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  it("returns active lost and found reports using the card response fields", async () => {
    const res = await request(app).get("/api/items?type=all&sort=newest");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.length(3);
    expect(res.body.map((item) => item.type)).to.have.members([
      "found",
      "found",
      "lost",
    ]);
    expect(res.body.map((item) => item.title)).to.not.include(
      "Wireless Noise Cancelling Earbuds",
    );
    expect(res.body[0]).to.have.all.keys(
      "id",
      "type",
      "title",
      "category",
      "location",
      "date",
      "photos",
      "status",
    );
    expect(res.body[0].title).to.equal("Black Leather Bi-fold Wallet");
    expect(res.body[0].location).to.equal("Burwood");
    expect(res.body[0].status).to.equal("active");
  });

  it("supports the Lost and Found views", async () => {
    const [lostRes, foundRes] = await Promise.all([
      request(app).get("/api/items?type=lost"),
      request(app).get("/api/items?type=found"),
    ]);

    expect(lostRes.status).to.equal(200);
    expect(lostRes.body).to.have.length(1);
    expect(lostRes.body[0].type).to.equal("lost");

    expect(foundRes.status).to.equal(200);
    expect(foundRes.body).to.have.length(2);
    expect(foundRes.body.every((item) => item.type === "found")).to.equal(true);
  });

  it("sorts and paginates the database results for the browse grid", async () => {
    const res = await request(app).get(
      "/api/items?type=all&sort=oldest&page=2&limit=2",
    );

    expect(res.status).to.equal(200);
    expect(res.body).to.include({ total: 3, page: 2, totalPages: 2 });
    expect(res.body.items).to.have.length(1);
    expect(res.body.items[0].title).to.equal("Black Leather Bi-fold Wallet");
  });

  it("includes legacy reports without a status as active", async () => {
    await LostItem.collection.insertOne({
      ownerId: seed.testUserIds.alice,
      title: "Legacy Lost Item",
      category: "Other",
      description: "Created before report statuses were introduced",
      lostAt: new Date("2026-08-31T09:00:00.000Z"),
      campusLocation: "Waterfront",
      photos: [],
    });

    const res = await request(app).get("/api/items?type=lost");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.length(2);
    expect(res.body.find((item) => item.title === "Legacy Lost Item")).to.include({
      type: "lost",
      status: "active",
      location: "Waterfront",
    });
  });

  it("returns active report counts from both collections", async () => {
    const res = await request(app).get("/api/items/counts");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ all: 3, found: 2, lost: 1 });
  });
});
