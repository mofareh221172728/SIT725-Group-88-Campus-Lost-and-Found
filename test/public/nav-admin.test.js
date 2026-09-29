"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { expect } = require("chai");

const PUBLIC_DIR = path.join(__dirname, "../../public");
const SCRIPT = fs.readFileSync(path.join(PUBLIC_DIR, "js/nav-auth.js"), "utf8");

// Pages whose nav includes the Admin link.
const NAV_PAGES = [
  "browse.html",
  "edit-report.html",
  "help.html",
  "item-detail.html",
  "my-reports.html",
  "report.html",
  "search-filter.html",
];

// Runs nav-auth.js against a fake nav item and a stubbed /api/auth/me response.
async function runNavAdmin(meResponse) {
  const item = {
    hidden: true,
    removeAttribute(name) {
      if (name === "hidden") this.hidden = false;
    },
  };
  let onReady;

  vm.runInNewContext(SCRIPT, {
    document: {
      addEventListener: (event, handler) => {
        onReady = handler;
      },
      querySelectorAll: () => [item],
      // No Login link, so only the admin-link logic runs.
      querySelector: () => null,
    },
    api: { get: meResponse },
  });

  await onReady();
  return item;
}

describe("Admin nav link visibility", () => {
  it("NAV-ADMIN-01: every nav page ships the Admin link hidden and loads nav-auth.js", () => {
    NAV_PAGES.forEach((page) => {
      const html = fs.readFileSync(path.join(PUBLIC_DIR, page), "utf8");
      const adminItem = html.match(/<li[^>]*data-admin-only[^>]*>/);

      expect(adminItem, `${page} has no data-admin-only nav item`).to.not.equal(null);
      expect(adminItem[0], `${page} Admin link is not hidden by default`).to.match(/\shidden[\s>]/);
      expect(html, `${page} does not load nav-auth.js`).to.include('src="js/nav-auth.js"');
    });
  });

  it("NAV-ADMIN-02: shows the Admin link for an admin session", async () => {
    const item = await runNavAdmin(async () => ({ user: { role: "admin" } }));
    expect(item.hidden).to.equal(false);
  });

  it("NAV-ADMIN-03: keeps the Admin link hidden for a non-admin session", async () => {
    const item = await runNavAdmin(async () => ({ user: { role: "user" } }));
    expect(item.hidden).to.equal(true);
  });

  it("NAV-ADMIN-04: keeps the Admin link hidden when logged out or the request fails", async () => {
    const item = await runNavAdmin(async () => {
      throw new Error("Unauthorized");
    });
    expect(item.hidden).to.equal(true);
  });
});
