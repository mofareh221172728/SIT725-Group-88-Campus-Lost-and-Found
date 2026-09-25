"use strict";

const { expect } = require("chai");
const mongoose = require("mongoose");
const Photo = require("../../models/photo.model");
const photosService = require("../../services/photos.service");
const db = require("../helpers/db");

describe("Photos Service", () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  const jpegData = Buffer.from([0xff, 0xd8, 0xff, 0x00]);

  it("stores uploaded file buffers and metadata", async () => {
    const photos = await photosService.createPhotos([
      {
        buffer: jpegData,
        mimetype: "image/jpeg",
        originalname: "item.jpg",
        size: jpegData.length,
      },
    ]);

    expect(photos).to.have.lengthOf(1);

    const storedPhoto = await Photo.findById(photos[0]._id);
    expect(Buffer.from(storedPhoto.data)).to.deep.equal(jpegData);
    expect(storedPhoto.contentType).to.equal("image/jpeg");
    expect(storedPhoto.originalName).to.equal("item.jpg");
    expect(storedPhoto.size).to.equal(jpegData.length);
  });

  it("retrieves stored photo binary data", async () => {
    const storedPhoto = await Photo.create({
      data: jpegData,
      contentType: "image/jpeg",
      originalName: "item.jpg",
      size: jpegData.length,
    });

    const photo = await photosService.getPhoto(String(storedPhoto._id));

    expect(Buffer.from(photo.data)).to.deep.equal(jpegData);
    expect(photo.contentType).to.equal("image/jpeg");
  });

  it("returns null for an invalid photo ID", async () => {
    expect(await photosService.getPhoto("not-an-id")).to.equal(null);
  });

  it("deletes the selected photos", async () => {
    const photos = await Photo.create([
      {
        data: jpegData,
        contentType: "image/jpeg",
        originalName: "one.jpg",
        size: jpegData.length,
      },
      {
        data: jpegData,
        contentType: "image/jpeg",
        originalName: "two.jpg",
        size: jpegData.length,
      },
    ]);

    await photosService.deletePhotos(photos.map((photo) => photo._id));

    expect(await Photo.countDocuments()).to.equal(0);
  });

  it("returns null when a valid photo ID does not exist", async () => {
    const photo = await photosService.getPhoto(
      String(new mongoose.Types.ObjectId()),
    );

    expect(photo).to.equal(null);
  });
});
