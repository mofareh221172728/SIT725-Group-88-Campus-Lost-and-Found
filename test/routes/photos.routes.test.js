"use strict";

const { expect } = require("chai");
const mongoose = require("mongoose");
const request = require("supertest");
const { app } = require("../../server");
const Photo = require("../../models/photo.model");
const db = require("../helpers/db");

function parseBinary(response, callback) {
  const chunks = [];

  response.on("data", (chunk) => chunks.push(chunk));
  response.on("end", () => callback(null, Buffer.concat(chunks)));
}

describe("Photo Routes - Retrieve Photo (GET /api/photos/:id)", () => {
  before(db.connect);
  afterEach(db.clearCollections);
  after(db.disconnect);

  it("returns stored binary data with its content type", async () => {
    const data = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const photo = await Photo.create({
      data,
      contentType: "image/jpeg",
      originalName: "item.jpg",
      size: data.length,
    });

    const response = await request(app)
      .get(`/api/photos/${photo._id}`)
      .buffer(true)
      .parse(parseBinary);

    expect(response.status).to.equal(200);
    expect(response.headers["content-type"]).to.match(/^image\/jpeg/);
    expect(response.headers["x-content-type-options"]).to.equal("nosniff");
    expect(response.body).to.deep.equal(data);
  });

  it("returns 404 for an invalid photo ID", async () => {
    const response = await request(app).get("/api/photos/not-an-id");

    expect(response.status).to.equal(404);
    expect(response.body.message).to.equal("Photo was not found.");
  });

  it("returns 404 when the photo does not exist", async () => {
    const id = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/api/photos/${id}`);

    expect(response.status).to.equal(404);
    expect(response.body.message).to.equal("Photo was not found.");
  });
});
