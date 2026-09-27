"use strict";

const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../../server");

describe("Not found handling (404)", () => {
  it("NF-01: shows the 404 page for an unknown page URL", async () => {
    const response = await request(app).get("/this-page-does-not-exist.html");

    expect(response.status).to.equal(404);
    expect(response.headers["content-type"]).to.match(/text\/html/);
    expect(response.text).to.include("Page not found");
  });

  it("NF-02: shows the 404 page for a nested unknown URL with working asset paths", async () => {
    const response = await request(app).get("/reports/old/link");

    expect(response.status).to.equal(404);
    expect(response.text).to.include('href="/css/style.css"');
    expect(response.text).to.include('href="/css/ui-state.css"');
    expect(response.text).to.include('src="/js/ui-state.js"');
  });

  it("NF-03: returns JSON, not HTML, for an unknown API route", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).to.equal(404);
    expect(response.headers["content-type"]).to.match(/application\/json/);
    expect(response.body).to.deep.equal({ message: "API route was not found." });
  });

  it("NF-04: still serves existing pages and assets", async () => {
    const page = await request(app).get("/help.html");
    const script = await request(app).get("/js/ui-state.js");

    expect(page.status).to.equal(200);
    expect(script.status).to.equal(200);
  });
});
