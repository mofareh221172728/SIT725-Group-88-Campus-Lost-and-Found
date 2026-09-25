"use strict";

const express = require("express");
const photosService = require("../services/photos.service");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const photo = await photosService.getPhoto(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: "Photo was not found." });
    }

    res.set("Content-Type", photo.contentType);
    res.set("X-Content-Type-Options", "nosniff");
    return res.send(photo.data);
  } catch (error) {
    console.error("Get photo error:", error);
    return res.status(500).json({ message: "Unable to get photo." });
  }
});

module.exports = router;
