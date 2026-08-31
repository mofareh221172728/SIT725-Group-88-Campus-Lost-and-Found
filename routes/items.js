const express = require('express');
const router = express.Router();

// Temporary in-memory storage for reported items
const items = [];

// POST /api/items - create a new lost or found item report
router.post('/', (req, res) => {
  const {
    type,
    title,
    category,
    date,
    location,
    description
  } = req.body;

  // Basic validation
  if (!type || !title || !category || !date || !location || !description) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided.'
    });
  }

  // Only lost or found reports are accepted
  if (!['lost', 'found'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Type must be either lost or found.'
    });
  }

  const newItem = {
    id: Date.now().toString(),
    type,
    title,
    category,
    date,
    location,
    description,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  items.push(newItem);

  return res.status(201).json({
    success: true,
    message: 'Item report created successfully.',
    item: newItem
  });
  });

// GET /api/items - return all reported items
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    count: items.length,
    items: items
  });
});

module.exports = {
  router,
  items
};