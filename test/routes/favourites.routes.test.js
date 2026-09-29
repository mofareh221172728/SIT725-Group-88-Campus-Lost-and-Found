"use strict";

const { expect } = require("chai");
const request = require("supertest");

const { app } = require("../../server");
const db = require("../helpers/db");
const User = require("../../models/user.model");
const LostItem = require("../../models/lostItem.model");

describe("Card #123 - Favourite Items API", () => {
  let agent;
  let user;
  let lostItem;

  before(async () => {
    await db.connect();
  });

  beforeEach(async () => {
    await db.clearCollections();

    user = await User.create({
      email: "favourite-api@example.com",
    });

    lostItem = await LostItem.create({
      ownerId: user._id,
      title: "Lost Wallet",
      category: "Personal Items",
      description: "Black wallet lost on campus",
      lostAt: new Date("2026-09-20"),
      campusLocation: "Burwood Campus",
    });

    agent = request.agent(app);

    const loginResponse = await agent
      .post("/api/auth/login")
      .send({ email: user.email });

    expect(loginResponse.status).to.equal(200);
  });

  after(async () => {
    await db.disconnect();
  });

  it("adds an item to the current user's favourites", async () => {
    const response = await agent
      .post("/api/favourites")
      .send({
        itemId: lostItem._id.toString(),
        itemType: "lost",
      });

    expect(response.status).to.equal(201);
    expect(response.body.favourite.itemId).to.equal(
      lostItem._id.toString(),
    );
    expect(response.body.favourite.itemType).to.equal("lost");
  });

  it("retrieves favourites for the current user", async () => {
    await agent
      .post("/api/favourites")
      .send({
        itemId: lostItem._id.toString(),
        itemType: "lost",
      });

    const response = await agent.get("/api/favourites");

    expect(response.status).to.equal(200);
    expect(response.body.favourites).to.have.lengthOf(1);
    expect(response.body.favourites[0].itemId).to.equal(
      lostItem._id.toString(),
    );
  });

  it("does not create duplicate favourites", async () => {
    await agent
      .post("/api/favourites")
      .send({
        itemId: lostItem._id.toString(),
        itemType: "lost",
      });

    const response = await agent
      .post("/api/favourites")
      .send({
        itemId: lostItem._id.toString(),
        itemType: "lost",
      });

    expect(response.status).to.equal(201);

    const favouritesResponse = await agent.get("/api/favourites");

    expect(favouritesResponse.body.favourites).to.have.lengthOf(1);
  });

  it("removes an item from favourites", async () => {
    await agent
      .post("/api/favourites")
      .send({
        itemId: lostItem._id.toString(),
        itemType: "lost",
      });

    const response = await agent.delete(
      `/api/favourites/lost/${lostItem._id}`,
    );

    expect(response.status).to.equal(200);

    const favouritesResponse = await agent.get("/api/favourites");

    expect(favouritesResponse.body.favourites).to.have.lengthOf(0);
  });

  it("rejects an invalid item ID", async () => {
    const response = await agent
      .post("/api/favourites")
      .send({
        itemId: "invalid-id",
        itemType: "lost",
      });

    expect(response.status).to.equal(400);
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/favourites");

    expect(response.status).to.equal(401);
  });
});