const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Temporary in-memory storage
const items = [];

// GET all items
app.get('/api/items', (req, res) => {
  res.json(items);
});

// POST a new item
app.post('/api/items', (req, res) => {
  const {
    type,
    title,
    category,
    date,
    location,
    description
  } = req.body;

  // Required field validation
  if (
    !type ||
    !title ||
    !category ||
    !date ||
    !location ||
    !description
  ) {
    return res.status(400).json({
      message: 'All required fields must be provided.'
    });
  }

  const newItem = {
    id: items.length + 1,
    type,
    title,
    category,
    date,
    location,
    description
  };

  items.push(newItem);

  res.status(201).json({
    message: 'Report created successfully.',
    item: newItem
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});