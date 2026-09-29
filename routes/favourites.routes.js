"use strict";

const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const favouritesService = require("../services/favourites.service");

const router = express.Router();

// Get all favourites for the logged-in user
router.get("/", requireAuth, async (req, res) => {
  try {
    const favourites = await favouritesService.getFavourites(
      req.session.userId,
    );

    return res.status(200).json({
      favourites,
    });
  } catch (error) {
    console.error("Get favourites error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Unable to retrieve favourites.",
    });
  }
});

// Add an item to favourites
router.post("/", requireAuth, async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    const favourite = await favouritesService.addFavourite(
      req.session.userId,
      itemId,
      itemType,
    );

    return res.status(201).json({
      message: "Item added to favourites.",
      favourite,
    });
  } catch (error) {
    if ([400, 404, 409].includes(error.status)) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error("Add favourite error:", error);

    return res.status(500).json({
      message: "Unable to add favourite.",
    });
  }
});

// Remove an item from favourites
router.delete("/:itemType/:itemId", requireAuth, async (req, res) => {
  try {
    const { itemType, itemId } = req.params;

    const favourite = await favouritesService.removeFavourite(
      req.session.userId,
      itemId,
      itemType,
    );

    if (!favourite) {
      return res.status(404).json({
        message: "Favourite was not found.",
      });
    }

    return res.status(200).json({
      message: "Item removed from favourites.",
    });
  } catch (error) {
    if ([400, 404].includes(error.status)) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    console.error("Remove favourite error:", error);

    return res.status(500).json({
      message: "Unable to remove favourite.",
    });
  }
});

module.exports = router;