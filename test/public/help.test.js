"use strict";

const { expect } = require("chai");
const { faqMatches, normaliseText } = require("../../public/js/help");

describe("Help page frontend helpers", () => {
  const faq = {
    category: "reporting",
    question: "Can I add photos to my report?",
    answer: "Yes. You can add up to three photos.",
  };

  it("HP-01: shows every FAQ when there is no search text and All is selected", () => {
    expect(faqMatches(faq, "", "all")).to.equal(true);
  });

  it("HP-02: matches search text in the question or answer, ignoring case", () => {
    expect(faqMatches(faq, "PHOTOS", "all")).to.equal(true);
    expect(faqMatches(faq, "three", "all")).to.equal(true);
  });

  it("HP-03: requires every search word to match", () => {
    expect(faqMatches(faq, "photos report", "all")).to.equal(true);
    expect(faqMatches(faq, "photos drop-off", "all")).to.equal(false);
  });

  it("HP-04: hides FAQs outside the selected category", () => {
    expect(faqMatches(faq, "", "reporting")).to.equal(true);
    expect(faqMatches(faq, "", "managing")).to.equal(false);
  });

  it("HP-05: normalises extra spaces in search text", () => {
    expect(normaliseText("  Add   Photos ")).to.equal("add photos");
    expect(faqMatches(faq, "  add   photos  ", "all")).to.equal(true);
  });
});
