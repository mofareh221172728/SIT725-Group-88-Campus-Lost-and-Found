"use strict";

const { expect } = require("chai");
const mongoose = require("mongoose");
const HelpQuestion = require("../../models/helpQuestion.model");
const { HELP_CATEGORIES } = require("../../models/helpQuestion.model");

async function getValidationError(doc) {
  try {
    await doc.validate();
    return undefined;
  } catch (error) {
    return error;
  }
}

function validQuestion() {
  return {
    ownerId: new mongoose.Types.ObjectId(),
    title: "Where do I collect a dropped-off item?",
    body: "The report says Campus Security. Which building is that in?",
    category: "finding",
  };
}

describe("HelpQuestion Model Schema Validation", () => {
  it("HQ-01: accepts a valid question", async () => {
    expect(await getValidationError(new HelpQuestion(validQuestion()))).to.be.undefined;
  });

  it('HQ-02: defaults status to "open" and category to "other"', async () => {
    const data = validQuestion();
    delete data.category;
    const question = new HelpQuestion(data);

    expect(await getValidationError(question)).to.be.undefined;
    expect(question.status).to.equal("open");
    expect(question.category).to.equal("other");
  });

  it('HQ-03: accepts every Help category and the "answered" status', async () => {
    for (const category of HELP_CATEGORIES) {
      const question = new HelpQuestion({ ...validQuestion(), category, status: "answered" });
      expect(await getValidationError(question), category).to.be.undefined;
    }
  });

  ["ownerId", "title", "body"].forEach((field, index) => {
    it(`HQ-0${4 + index}: rejects a question without ${field}`, async () => {
      const data = validQuestion();
      delete data[field];
      const error = await getValidationError(new HelpQuestion(data));

      expect(error).to.exist;
      expect(error.errors[field]).to.exist;
    });
  });

  it("HQ-07: trims text and lowercases the category", async () => {
    const question = new HelpQuestion({
      ...validQuestion(),
      title: "   How do I edit a report?   ",
      body: "   I cannot find the Edit button on my report.   ",
      category: "  Managing ",
    });

    expect(await getValidationError(question)).to.be.undefined;
    expect(question.title).to.equal("How do I edit a report?");
    expect(question.body).to.equal("I cannot find the Edit button on my report.");
    expect(question.category).to.equal("managing");
  });

  it("HQ-08: rejects a title that is too short or too long", async () => {
    for (const title of ["Help", "a".repeat(151)]) {
      const error = await getValidationError(new HelpQuestion({ ...validQuestion(), title }));
      expect(error.errors.title, title.slice(0, 10)).to.exist;
    }
  });

  it("HQ-09: rejects a question body that is too short or too long", async () => {
    for (const body of ["   too short   ", "a".repeat(2001)]) {
      const error = await getValidationError(new HelpQuestion({ ...validQuestion(), body }));
      expect(error.errors.body, body.slice(0, 10)).to.exist;
    }
  });

  it("HQ-10: rejects a category that is not a Help category", async () => {
    const error = await getValidationError(
      new HelpQuestion({ ...validQuestion(), category: "billing" }),
    );
    expect(error.errors.category).to.exist;
  });

  it("HQ-11: rejects a status that is not open or answered", async () => {
    const error = await getValidationError(
      new HelpQuestion({ ...validQuestion(), status: "closed" }),
    );
    expect(error.errors.status).to.exist;
  });

  it("HQ-12: rejects an ownerId that is not a valid ObjectId", async () => {
    const error = await getValidationError(
      new HelpQuestion({ ...validQuestion(), ownerId: "me" }),
    );
    expect(error.errors.ownerId).to.exist;
  });

  it("HQ-13: stores createdAt and updatedAt timestamps", () => {
    expect(HelpQuestion.schema.path("createdAt")).to.exist;
    expect(HelpQuestion.schema.path("updatedAt")).to.exist;
  });
});
