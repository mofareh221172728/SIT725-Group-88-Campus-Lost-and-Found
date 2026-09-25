"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");
const User = require("../../models/user.model");
const LostItem = require("../../models/lostItem.model");
const db = require("../helpers/db");
const seed = require("../helpers/seed");

describe("My Reports - current user only", () => {
  before(db.connect);
  beforeEach(seed.seedAll);
  afterEach(db.clearCollections);
  after(db.disconnect);

  async function login(index) {
    const agent = request.agent(app);
    await agent.post("/api/auth/login")
      .send({ email: seed.sampleUsers[index].email })
      .expect(200);
    return agent;
  }

  it("requires a session and an existing user", async () => {
    await request(app).get("/api/items/mine").expect(401);
    const alice = await login(0);
    await User.deleteOne({ _id: seed.testUserIds.alice });
    await alice.get("/api/items/mine").expect(401);
  });

  it("returns only the signed-in owner's found and lost reports, including resolved", async () => {
    const alice = await login(0);
    const bob = await login(1);
    const mine = (await alice.get("/api/items/mine").expect(200)).body;
    expect(mine.found.map((item) => item.id)).to.deep.equal([
      String(seed.sampleFoundItems[0]._id),
    ]);
    expect(mine.lost.map((item) => item.id)).to.deep.equal([
      String(seed.sampleLostItems[0]._id),
    ]);
    expect(mine.found[0]).to.include({
      type: "found", title: seed.sampleFoundItems[0].title, status: "active",
    });

    const others = (await bob.get("/api/items/mine").expect(200)).body;
    expect(others.found.map((item) => item.id)).to.deep.equal([
      String(seed.sampleFoundItems[1]._id),
    ]);
    expect(others.lost[0]).to.include({
      id: String(seed.sampleLostItems[1]._id), status: "resolved",
    });
  });

  it("shows a newly created report and its saved resolved status", async () => {
    const alice = await login(0);
    const report = await LostItem.create({
      ownerId: seed.testUserIds.alice,
      title: "Lost blue umbrella",
      category: "Other",
      description: "Blue umbrella lost near the library entrance.",
      lostAt: new Date("2026-09-05"),
      campusLocation: "Burwood, Building LC",
    });
    const id = String(report._id);
    const before = (await alice.get("/api/items/mine").expect(200)).body;
    expect(before.lost[0]).to.include({ id, status: "active" });

    await alice.put(`/api/items/lost/${id}/status`)
      .send({ status: "resolved" }).expect(200);
    const after = (await alice.get("/api/items/mine").expect(200)).body;
    expect(after.lost.find((item) => item.id === id).status).to.equal("resolved");
  });
});
