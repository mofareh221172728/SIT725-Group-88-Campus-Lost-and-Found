"use strict";

const { expect } = require("chai");
const { formatItemDate } = require("../../public/js/item-detail");
const { reportCardHTML } = require("../../public/js/browse");

describe("Item detail frontend helpers", () => {
  it("formats stored report dates for display", () => {
    expect(formatItemDate("2026-09-09T06:11:59.355Z")).to.equal("9 Sept 2026");
  });

  it("returns a fallback for an invalid date", () => {
    expect(formatItemDate("not-a-date")).to.equal("Date not provided");
  });

  it("includes the report ID and type in a Browse detail link", () => {
    const html = reportCardHTML({
      id: "650000000000000000000101",
      type: "found",
      title: "Blue Bottle",
    });

    expect(html).to.include(
      "item-detail.html?id=650000000000000000000101&type=found",
    );
  });
});
