"use strict";

class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(method, url, data) {
  const options = {
    method,
    headers: {
      Accept: "application/json",
    },
    // Mock authentication uses an Express session cookie.
    credentials: "include",
  };

  if (data !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new ApiError("Unable to connect to the server.");
  }

  let responseText;

  try {
    responseText = response.status === 204 ? "" : await response.text();
  } catch (error) {
    throw new ApiError("Unable to read the server response.", response.status);
  }
  let responseData = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      responseData = responseText;
    }
  }

  if (!response.ok) {
    const message =
      responseData && typeof responseData === "object"
        ? responseData.message
        : responseData;

    throw new ApiError(
      message || `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return responseData;
}

const api = {
  get(url) {
    return request("GET", url);
  },
  post(url, data) {
    return request("POST", url, data);
  },
  put(url, data) {
    return request("PUT", url, data);
  },
};

if (typeof window !== "undefined") {
  window.api = api;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { api, ApiError };
}