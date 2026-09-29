"use strict";

const { expect } = require("chai");
const request = require("supertest");

const { app } = require("../../server");
const db = require("../helpers/db");
const User = require("../../models/user.model");
const LostItem = require("../../models/lostItem.model");

describe("Card #123 - Favourite Items API", () => {
  let agent;
  let secondAgent;
  let user;
  let secondUser;
  let lostItem;

  before(async () => {
    await db.connect();
  });

  beforeEach(async () => {
    await db.clearCollections();

    user = await User.create({
      email: "favourite-api@example.com",
    });

    secondUser = await User.create({
      email: "favourite-api-second@example.com",
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
  
   
    secondAgent = request.agent(app);

    const secondLoginResponse = await secondAgent
      .post("/api/auth/login")
      .send({ email: secondUser.email });

    expect(secondLoginResponse.status).to.equal(200);
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

  it("does not expose one user's favourites to another user", async () => {
  await agent
    .post("/api/favourites")
    .send({
      itemId: lostItem._id.toString(),
      itemType: "lost",
    });

    const response = await secondAgent.get("/api/favourites");

    expect(response.status).to.equal(200);
    expect(response.body.favourites).to.have.lengthOf(0);
});

  it("does not allow another user to remove a favourite", async () => {
   await agent
    .post("/api/favourites")
    .send({
      itemId: lostItem._id.toString(),
      itemType: "lost",
    });

    const deleteResponse = await secondAgent.delete(
    `/api/favourites/lost/${lostItem._id}`,
    );

    expect(deleteResponse.status).to.equal(404);

    const ownerResponse = await agent.get("/api/favourites");

    expect(ownerResponse.status).to.equal(200);
    expect(ownerResponse.body.favourites).to.have.lengthOf(1);
  });

      it("rejects a valid item ID when the report does not exist", async () => {
    const missingItemId = new LostItem()._id.toString();

    const response = await agent
      .post("/api/favourites")
      .send({
        itemId: missingItemId,
        itemType: "lost",
     });

      expect(response.status).to.equal(404);
      expect(response.body.message).to.equal("Item was not found.");
  });
    
    it("rejects unauthenticated favourite requests", async () => {
    const getResponse = await request(app).get("/api/favourites");

    const postResponse = await request(app)
      .post("/api/favourites")
      .send({
        itemId: lostItem._id.toString(),
        itemType: "lost",
      });

    const deleteResponse = await request(app).delete(
      `/api/favourites/lost/${lostItem._id}`,
    );

    expect(getResponse.status).to.equal(401);
    expect(postResponse.status).to.equal(401);
    expect(deleteResponse.status).to.equal(401);
  });
});