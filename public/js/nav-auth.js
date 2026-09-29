"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const adminItems = document.querySelectorAll("[data-admin-only]");
  const loginLink = document.querySelector('.switcher a[href$="index.html"]');

  if (!adminItems.length && !loginLink) return;

  try {
    const { user } = await api.get("/api/auth/me");

    // UX only. Real admin enforcement remains server-side.
    if (user?.role === "admin") {
      adminItems.forEach((el) => el.removeAttribute("hidden"));
    }

    if (!loginLink) return;

    const signOutButton = document.createElement("button");
    signOutButton.type = "button";
    signOutButton.className = loginLink.className.replace(/\bactive\b/g, "").trim();
    signOutButton.textContent = "Sign out";
    signOutButton.setAttribute("role", loginLink.getAttribute("role") || "menuitem");

    loginLink.replaceWith(signOutButton);

    signOutButton.addEventListener("click", async () => {
      const previousError = signOutButton.parentElement.querySelector(".nav-auth-error");
      if (previousError) previousError.remove();

      signOutButton.disabled = true;
      signOutButton.setAttribute("aria-busy", "true");
      signOutButton.textContent = "Signing out…";

      try {
        await api.post("/api/auth/logout");
        window.location.assign("/index.html");
      } catch (error) {
        signOutButton.disabled = false;
        signOutButton.removeAttribute("aria-busy");
        signOutButton.textContent = "Sign out";

        const errorMessage = document.createElement("span");
        errorMessage.className = "nav-auth-error";
        errorMessage.setAttribute("role", "alert");
        errorMessage.textContent = error.message || "Unable to sign out. Please try again.";
        signOutButton.parentElement.appendChild(errorMessage);
      }
    });
  } catch {
    // Logged out or unable to check the session: keep Login visible.
  }
});
