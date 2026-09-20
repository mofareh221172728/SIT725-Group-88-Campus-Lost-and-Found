"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createPage(get) {
  const elements = {};
  for (const id of ["report-grid", "browse-status", "browse-count", "browse-pagination", "browse-keyword"]) {
    const classes = new Set();
    elements[id] = {
      value: "", innerHTML: "", textContent: "", hidden: false,
      classList: {add: (name) => classes.add(name), remove: (name) => classes.delete(name)},
    };
  }
  const context = {
    module: {exports: {}},
    api: {get}, URLSearchParams, Intl,
    console: {error() {}},
    document: {
      getElementById: (id) => elements[id] || null,
      querySelector: () => ({dataset: {toggleOption: "found"}}),
      addEventListener() {},
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../../public/js/browse.js"), "utf8"), context);
  return {elements, load: context.module.exports.loadReportedItems};
}

function result(title, page = 1) {
  return {items: [{id: "item-1", title, type: "found", status: "active"}], total: 1, totalPages: 1, page};
}

describe("Browse keyword search", () => {
  it("sends the trimmed keyword with type and page filters", async () => {
    let requestUrl;
    const page = createPage(async (url) => {requestUrl = url; return result("Water bottle");});
    page.elements["browse-keyword"].value = "  water & bottle  ";
    await page.load(2);
    const query = new URL(requestUrl, "http://localhost").searchParams;
    assert.equal(query.get("keyword"), "water & bottle");
    assert.equal(query.get("type"), "found");
    assert.equal(query.get("page"), "2");
    assert.equal(query.get("limit"), "12");
    assert.match(page.elements["report-grid"].innerHTML, /Water bottle/);
  });

  it("shows a search message for no matches and clears the keyword for the full list", async () => {
    const requests = [];
    const page = createPage(async (url) => {requests.push(url); return {items: [], total: 0, totalPages: 1, page: 1};});
    page.elements["browse-keyword"].value = "missing";
    await page.load(1, "all");
    assert.equal(page.elements["browse-status"].textContent, "No active reports match your search.");
    assert.equal(page.elements["report-grid"].innerHTML, "");
    page.elements["browse-keyword"].value = "";
    await page.load(1, "all");
    const query = new URL(requests.at(-1), "http://localhost").searchParams;
    assert.equal(query.has("keyword"), false);
    assert.equal(query.has("type"), false);
    assert.equal(query.get("page"), "1");
  });

  for (const oldFails of [false, true]) {
    it(`ignores an older ${oldFails ? "failed" : "successful"} request after a newer search`, async () => {
      const pending = [];
      const page = createPage(() => new Promise((resolve, reject) => pending.push({resolve, reject})));
      page.elements["browse-keyword"].value = "old";
      const old = page.load();
      page.elements["browse-keyword"].value = "water";
      const current = page.load();
      pending[1].resolve(result("Water bottle"));
      await current;
      if (oldFails) pending[0].reject(new Error("Old request failed"));
      else pending[0].resolve(result("Old result"));
      await old;
      assert.match(page.elements["report-grid"].innerHTML, /Water bottle/);
      assert.doesNotMatch(page.elements["report-grid"].innerHTML, /Old result/);
      assert.equal(page.elements["browse-status"].hidden, true);
    });
  }
});
