const authService = require("../services/auth.service");

async function requireAdmin(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.session.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access is required.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Unable to verify admin access.",
    });
  }
}

module.exports = requireAdmin;
