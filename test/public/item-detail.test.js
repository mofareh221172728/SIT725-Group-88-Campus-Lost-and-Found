"use strict";

const { expect } = require("chai");
const {
  formatItemDate,
  extractCampus,
  loadPotentialMatches,
} = require("../../public/js/item-detail");
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

  describe("extractCampus", () => {
    it("extracts campus name from a full address with building and room", () => {
      expect(extractCampus("Burwood, Building BC, Room 2.10")).to.equal("Burwood");
      expect(extractCampus("Waurn Ponds, Building KA, Room 101")).to.equal("Waurn Ponds");
      expect(extractCampus("Waterfront, Level 3")).to.equal("Waterfront");
      expect(extractCampus("Warrnambool, Cafeteria")).to.equal("Warrnambool");
    });

    it("matches campus from compound or prefixed names", () => {
      expect(extractCampus("Melbourne Burwood, Building A")).to.equal("Burwood");
      expect(extractCampus("Geelong Waurn Ponds Campus")).to.equal("Waurn Ponds");
      expect(extractCampus("Geelong Waterfront")).to.equal("Waterfront");
    });

    it("handles plain campus names", () => {
      expect(extractCampus("Burwood")).to.equal("Burwood");
      expect(extractCampus("Waurn Ponds")).to.equal("Waurn Ponds");
    });

    it("falls back to the first segment for unrecognized locations", () => {
      expect(extractCampus("Off-Campus Hub, Level 1")).to.equal("Off-Campus Hub");
    });

    it("returns an empty string when location is empty or missing", () => {
      expect(extractCampus("")).to.equal("");
      expect(extractCampus(null)).to.equal("");
      expect(extractCampus(undefined)).to.equal("");
    });
  });

  describe("loadPotentialMatches", () => {
    let originalDocument;
    let originalApi;
    let elements;

    beforeEach(() => {
      originalDocument = global.document;
      originalApi = global.api;
      global.reportCardHTML = reportCardHTML;

      elements = {
        "potential-matches": { hidden: true },
        "potential-matches-grid": { innerHTML: "" },
        "potential-matches-message": { textContent: "", hidden: true },
      };

      global.document = {
        getElementById: (id) => elements[id] || null,
      };
    });

    afterEach(() => {
      global.document = originalDocument;
      global.api = originalApi;
      delete global.reportCardHTML;
    });

    it("queries opposite report type and filters by campus rather than full address", async () => {
      let requestedUrl = null;
      global.api = {
        get: async (url) => {
          requestedUrl = url;
          return [
            {
              id: "item-2",
              type: "found",
              title: "Found AirPods",
              category: "Electronics",
              location: "Burwood, Library Level 2",
              status: "active",
            },
          ];
        },
      };

      await loadPotentialMatches({
        id: "item-1",
        type: "lost",
        category: "Electronics",
        location: "Burwood, Building BC, Room 2.10",
      });

      expect(requestedUrl).to.include("type=found");
      expect(requestedUrl).to.include("category=Electronics");
      expect(requestedUrl).to.include("location=Burwood");
      expect(requestedUrl).not.to.include("Building+BC");
      expect(elements["potential-matches"].hidden).to.be.false;
      expect(elements["potential-matches-grid"].innerHTML).to.include("Found AirPods");
      expect(elements["potential-matches-message"].hidden).to.be.true;
    });

    it("displays a fallback message when no matches are returned", async () => {
      global.api = {
        get: async () => [],
      };

      await loadPotentialMatches({
        id: "item-1",
        type: "lost",
        category: "Books",
        location: "Waurn Ponds, Building NA",
      });

      expect(elements["potential-matches-message"].hidden).to.be.false;
      expect(elements["potential-matches-message"].textContent).to.equal(
        "No potential matches found in the system right now.",
      );
      expect(elements["potential-matches-grid"].innerHTML).to.equal("");
    });
  });
});
