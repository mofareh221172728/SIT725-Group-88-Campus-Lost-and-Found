"use strict";

const { expect } = require("chai");
const { uiStateHTML, uiStateSafeHref } = require("../../public/js/ui-state");

describe("Fallback UI state component", () => {
  it("UI-01: announces errors immediately and other states politely", () => {
    expect(uiStateHTML({ type: "error" })).to.include('role="alert"');
    expect(uiStateHTML({ type: "error" })).to.include('aria-live="assertive"');
    expect(uiStateHTML({ type: "empty" })).to.include('role="status"');
    expect(uiStateHTML({ type: "not-found" })).to.include('aria-live="polite"');
  });

  it("UI-02: uses a default title and message for each state", () => {
    expect(uiStateHTML({ type: "error" })).to.include("Something went wrong");
    expect(uiStateHTML({ type: "not-found" })).to.include("no longer available");
    expect(uiStateHTML({ type: "loading" })).to.include('aria-busy="true"');
  });

  it("UI-03: shows a Try again button except while loading", () => {
    const options = { actionLabel: "Try again" };
    expect(uiStateHTML({ ...options, type: "error" })).to.include(">Try again</button>");
    expect(uiStateHTML({ ...options, type: "loading" })).to.not.include("<button");
  });

  it("UI-04: escapes titles, messages and link labels", () => {
    const html = uiStateHTML({
      type: "not-found",
      title: "<script>alert(1)</script>",
      message: 'Missing "/<img src=x>"',
      links: [{ href: "/help.html", label: "<b>Help</b>" }],
    });

    expect(html).to.not.include("<script>");
    expect(html).to.not.include("<img");
    expect(html).to.include("&lt;b&gt;Help&lt;/b&gt;");
  });

  it("UI-05: only allows same-site links", () => {
    expect(uiStateSafeHref("/browse.html")).to.equal("/browse.html");
    expect(uiStateSafeHref("help.html")).to.equal("help.html");
    expect(uiStateSafeHref("javascript:alert(1)")).to.equal("#");
    expect(uiStateSafeHref("//evil.example.com")).to.equal("#");
    expect(uiStateSafeHref("https://evil.example.com")).to.equal("#");
  });

  it("UI-06: falls back to the error state for an unknown type", () => {
    expect(uiStateHTML({ type: "weird" })).to.include("ui-state-error");
  });
});
