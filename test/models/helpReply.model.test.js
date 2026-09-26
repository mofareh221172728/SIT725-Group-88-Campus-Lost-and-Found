"use strict";

const { expect } = require("chai");
const mongoose = require("mongoose");
const HelpReply = require("../../models/helpReply.model");

async function getValidationError(doc) {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error;
  }
}

function validReply() {
  return {
    questionId: new mongoose.Types.ObjectId(),
    authorId: new mongoose.Types.ObjectId(),
    body: "Campus Security is in Building B, ground floor.",
  };
}

describe("HelpReply Model Schema Validation", () => {
  it("HR-01: accepts a valid reply", async () => {
    expect(await getValidationError(new HelpReply(validReply()))).to.be.undefined;
  });

  ["questionId", "authorId", "body"].forEach((field, index) => {
    it(`HR-0${2 + index}: rejects a reply without ${field}`, async () => {
      const data = validReply();
      delete data[field];
      const error = await getValidationError(new HelpReply(data));

      expect(error).to.exist;
      expect(error.errors[field]).to.exist;
    });
  });

  it("HR-05: trims the reply body", async () => {
    const reply = new HelpReply({ ...validReply(), body: "   Thanks, found it!   " });

    expect(await getValidationError(reply)).to.be.undefined;
    expect(reply.body).to.equal("Thanks, found it!");
  });

  it("HR-06: rejects a reply body that is too short or too long", async () => {
    for (const body of [" a ", "a".repeat(1001)]) {
      const error = await getValidationError(new HelpReply({ ...validReply(), body }));
      expect(error.errors.body, body.slice(0, 10)).to.exist;
    }
  });

  it("HR-07: rejects IDs that are not valid ObjectIds", async () => {
    const error = await getValidationError(
      new HelpReply({ ...validReply(), questionId: "q1", authorId: "admin" }),
    );
    expect(error.errors.questionId).to.exist;
    expect(error.errors.authorId).to.exist;
  });

  it("HR-08: indexes replies by question, oldest first", () => {
    const indexes = HelpReply.schema.indexes().map(([fields]) => fields);
    expect(indexes).to.deep.include({ questionId: 1, createdAt: 1 });
  });

  it("HR-09: stores createdAt and updatedAt timestamps", () => {
    expect(HelpReply.schema.path("createdAt")).to.exist;
    expect(HelpReply.schema.path("updatedAt")).to.exist;
  });
});
