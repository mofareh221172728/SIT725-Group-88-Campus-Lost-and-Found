"use strict";

const { expect } = require("chai");
const User = require("../../models/user.model");
const LostItem = require("../../models/lostItem.model");
const Favourite = require("../../models/favourite.model");
const favouritesService = require("../../services/favourites.service");
const db = require("../helpers/db");

describe("Favourite Service - Card #127", () => {
  let user;
  let lostItem;

  before(async () => {
    await db.connect();
  });

  beforeEach(async () => {
    await db.clearCollections();

    user = await User.create({
      email: "favourite-test@example.com",
    });

    lostItem = await LostItem.create({
      ownerId: user._id,
      title: "Lost Wallet",
      category: "Personal Items",
      description: "Black wallet lost on campus",
      lostAt: new Date("2026-09-20"),
      campusLocation: "Burwood Campus",
    });
  });

  after(async () => {
    await db.disconnect();
  });

  it("stores a favourite for the current user", async () => {
    const favourite = await favouritesService.addFavourite(
      user._id,
      lostItem._id,
      "lost",
    );

    expect(favourite.userId.toString()).to.equal(user._id.toString());
    expect(favourite.itemId.toString()).to.equal(lostItem._id.toString());
    expect(favourite.itemType).to.equal("lost");
  });

  it("prevents duplicate favourite relationships", async () => {
    await favouritesService.addFavourite(
      user._id,
      lostItem._id,
      "lost",
    );

    await favouritesService.addFavourite(
      user._id,
      lostItem._id,
      "lost",
    );

    const count = await Favourite.countDocuments({
      userId: user._id,
      itemId: lostItem._id,
      itemType: "lost",
    });

    expect(count).to.equal(1);
  });

  it("retrieves favourites for a specific user", async () => {
    await favouritesService.addFavourite(
      user._id,
      lostItem._id,
      "lost",
    );

    const favourites = await favouritesService.getFavourites(user._id);

    expect(favourites).to.have.lengthOf(1);
    expect(favourites[0].itemId.toString()).to.equal(
      lostItem._id.toString(),
    );
  });

  it("removes a favourite when the user unfavourites an item", async () => {
    await favouritesService.addFavourite(
      user._id,
      lostItem._id,
      "lost",
    );

    await favouritesService.removeFavourite(
      user._id,
      lostItem._id,
      "lost",
    );

    const count = await Favourite.countDocuments({
      userId: user._id,
    });

    expect(count).to.equal(0);
  });

  it("rejects a favourite for a report that does not exist", async () => {
    const missingId = new LostItem()._id;

    try {
      await favouritesService.addFavourite(
        user._id,
        missingId,
        "lost",
      );

      throw new Error("Expected addFavourite to fail");
    } catch (error) {
      expect(error.status).to.equal(404);
      expect(error.message).to.equal("Item was not found.");
    }
  });
});