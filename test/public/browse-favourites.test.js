"use strict";

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

describe("Card #125 - Favourite Dashboard Filter", () => {
  let browseHTML;
  let browseJS;

  before(() => {
    browseHTML = fs.readFileSync(
      path.join(__dirname, "../../public/browse.html"),
      "utf8",
    );

    browseJS = fs.readFileSync(
      path.join(__dirname, "../../public/js/browse.js"),
      "utf8",
    );
  });

  it("provides a Favourite filter on the dashboard", () => {
    expect(browseHTML).to.include('id="tab-favourites"');
    expect(browseHTML).to.include('data-toggle-option="favourites"');
  });

  it("uses the Favourite Items API", () => {
    expect(browseJS).to.include("api.get('/api/favourites')");
  });

  it("loads favourite items when the Favourite filter is selected", () => {
    expect(browseJS).to.include("selectedType === 'favourites'");
    expect(browseJS).to.include("loadFavouriteItems(requestId)");
  });

  it("filters reports using the current user's favourites", () => {
    expect(browseJS).to.include("favouriteKeys");
    expect(browseJS).to.include("activeReports = reports.filter");
  });

  it("provides an empty state when there are no favourites", () => {
    expect(browseJS).to.include("You have no favourite items yet.");
  });

  it("handles unauthenticated Favourite filter requests", () => {
    expect(browseJS).to.include(
      "Please log in to view your favourites.",
    );
  });
});
