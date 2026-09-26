"use strict";

const { expect } = require("chai");
const Photo = require("../../models/photo.model");

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

async function getValidationError(photo) {
  try {
    await photo.validate();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe("Photo Model Schema Validation", () => {
  it("accepts valid JPEG binary data", async () => {
    const photo = new Photo({
      data: Buffer.from([0xff, 0xd8, 0xff]),
      contentType: "image/jpeg",
      originalName: "item.jpg",
      size: 3,
    });

    expect(await getValidationError(photo)).to.be.undefined;
  });

  it("accepts valid PNG binary data", async () => {
    const photo = new Photo({
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      contentType: "image/png",
      originalName: "item.png",
      size: 4,
    });

    expect(await getValidationError(photo)).to.be.undefined;
  });

  it("requires binary data and metadata", async () => {
    const error = await getValidationError(new Photo({}));

    expect(error.errors.data).to.exist;
    expect(error.errors.contentType).to.exist;
    expect(error.errors.originalName).to.exist;
    expect(error.errors.size).to.exist;
  });

  it("rejects unsupported content types", async () => {
    const photo = new Photo({
      data: Buffer.from("not-an-image"),
      contentType: "image/webp",
      originalName: "item.webp",
      size: 12,
    });
    const error = await getValidationError(photo);

    expect(error.errors.contentType).to.exist;
  });

  it("rejects binary data larger than 5MB", async () => {
    const photo = new Photo({
      data: Buffer.alloc(MAX_PHOTO_SIZE_BYTES + 1),
      contentType: "image/jpeg",
      originalName: "large.jpg",
      size: MAX_PHOTO_SIZE_BYTES + 1,
    });
    const error = await getValidationError(photo);

    expect(error.errors.data).to.exist;
    expect(error.errors.size).to.exist;
  });
});
