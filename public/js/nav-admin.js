"use strict";

// UX only — [data-admin-only] nav items ship with `hidden` and are revealed
// for admin sessions. Real enforcement is server-side (requireAdmin on /api/admin/*).
document.addEventListener("DOMContentLoaded", async () => {
  const adminItems = document.querySelectorAll("[data-admin-only]");
  if (!adminItems.length) return;

  try {
    const { user } = await api.get("/api/auth/me");
    if (user?.role === "admin") {
      adminItems.forEach((el) => el.removeAttribute("hidden"));
    }
  } catch {
    // Logged out (401) or any error — leave the admin link hidden.
  }
});
