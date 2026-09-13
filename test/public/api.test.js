"use strict";

const { expect } = require("chai");
const { api, ApiError } = require("../../public/js/api");

function response({ ok = true, status = 200, body = null } = {}) {
  return {
    ok,
    status,
    text: async () => (body === null ? "" : JSON.stringify(body)),
  };
}

describe("Frontend API client", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("GET includes the mock session cookie and returns parsed JSON", async () => {
    let request;
    global.fetch = async (url, options) => {
      request = { url, options };
      return response({ body: { items: [] } });
    };

    const result = await api.get("/api/items");

    expect(result).to.deep.equal({ items: [] });
    expect(request.url).to.equal("/api/items");
    expect(request.options).to.deep.include({
      method: "GET",
      credentials: "include",
    });
    expect(request.options.headers.Accept).to.equal("application/json");
    expect(request.options).to.not.have.property("body");
  });

  for (const method of ["post", "put"]) {
    it(`${method.toUpperCase()} sends a JSON body with session credentials`, async () => {
      let options;
      global.fetch = async (url, requestOptions) => {
        options = requestOptions;
        return response({ body: { success: true } });
      };

      await api[method]("/api/items/1", { title: "Wallet" });

      expect(options.method).to.equal(method.toUpperCase());
      expect(options.credentials).to.equal("include");
      expect(options.headers["Content-Type"]).to.equal("application/json");
      expect(options.body).to.equal(JSON.stringify({ title: "Wallet" }));
    });
  }

  it("throws a consistent API error using the server message", async () => {
    global.fetch = async () =>
      response({
        ok: false,
        status: 401,
        body: { message: "Authentication is required." },
      });

    let error;
    try {
      await api.get("/api/auth/me");
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).to.be.instanceOf(ApiError);
    expect(error.message).to.equal("Authentication is required.");
    expect(error.status).to.equal(401);
  });

  it("converts network failures into a user-safe API error", async () => {
    global.fetch = async () => {
      throw new Error("socket details");
    };

    let error;
    try {
      await api.get("/api/items");
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).to.be.instanceOf(ApiError);
    expect(error.message).to.equal("Unable to connect to the server.");
    expect(error.status).to.equal(0);
  });

  it("handles a response body read failure consistently", async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => {
        throw new Error("stream interrupted");
      },
    });

    let error;
    try {
      await api.get("/api/items");
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).to.be.instanceOf(ApiError);
    expect(error.message).to.equal("Unable to read the server response.");
    expect(error.status).to.equal(200);
  });
});