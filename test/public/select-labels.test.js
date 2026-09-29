"use strict";

// Card #76: Materialize's generated select inputs must have an accessible name.

const { expect } = require("chai");
const { labelMaterializeSelects } = require("../../public/js/select-labels");

function fakeInput() {
  const attrs = {};
  return {
    setAttribute: (name, value) => { attrs[name] = value; },
    getAttribute: (name) => attrs[name],
  };
}

function fakeWrapper(selectId, input) {
  return {
    querySelector: (selector) => {
      if (selector === "select") return selectId === null ? null : { id: selectId };
      if (selector === "input.select-dropdown") return input;
      return null;
    },
  };
}

describe("Materialize select labels", () => {
  let originalDocument;

  beforeEach(() => { originalDocument = global.document; });
  afterEach(() => { global.document = originalDocument; });

  function setUpPage(wrappers, labels) {
    global.document = {
      querySelectorAll: () => wrappers,
      querySelector: (selector) => {
        const id = selector.match(/label\[for="(.+)"\]/)?.[1];
        return id in labels ? { textContent: labels[id] } : null;
      },
    };
  }

  it("A11Y-SEL-01: copies each select's label text onto the generated input", () => {
    const category = fakeInput();
    const campus = fakeInput();
    setUpPage(
      [fakeWrapper("item-category", category), fakeWrapper("item-campus", campus)],
      { "item-category": "Category", "item-campus": "Campus" },
    );

    labelMaterializeSelects();

    expect(category.getAttribute("aria-label")).to.equal("Category");
    expect(campus.getAttribute("aria-label")).to.equal("Campus");
  });

  it("A11Y-SEL-02: drops the required-field asterisk from the label text", () => {
    const input = fakeInput();
    setUpPage([fakeWrapper("item-category", input)], { "item-category": "Category *" });

    labelMaterializeSelects();

    expect(input.getAttribute("aria-label")).to.equal("Category");
  });

  it("A11Y-SEL-03: leaves the input alone when there is no label or select", () => {
    const noLabel = fakeInput();
    const noSelect = fakeInput();
    setUpPage([fakeWrapper("item-other", noLabel), fakeWrapper(null, noSelect)], {});

    expect(() => labelMaterializeSelects()).not.to.throw();
    expect(noLabel.getAttribute("aria-label")).to.equal(undefined);
    expect(noSelect.getAttribute("aria-label")).to.equal(undefined);
  });
});
