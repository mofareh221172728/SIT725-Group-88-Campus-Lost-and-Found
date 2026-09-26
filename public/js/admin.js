"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("admin-status");
  const content = document.getElementById("admin-content");

  function showMessage(message, isError) {
    status.textContent = message;
    status.classList.toggle("browse-message-error", isError);
  }

  try {
    const { user } = await api.get("/api/auth/me");

    if (user.role !== "admin") {
      showMessage("You are not authorized to view this page.", true);
      return;
    }

    status.classList.add("d-none");
    content.classList.remove("d-none");
  } catch (error) {
    if (error.status === 401) {
      showMessage("Please log in to view this page. Redirecting to login…", true);
      // Give the user time to read the message before redirecting.
      setTimeout(() => window.location.replace("index.html"), 2000);
      return;
    }

    showMessage("Unable to verify admin access. Please try again.", true);
  }
});
