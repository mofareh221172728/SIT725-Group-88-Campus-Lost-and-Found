// server.js  entry point
const express = require('express');
const path = require('path');
const pagesRouter = require('./routes/pages');
const itemsRouter = require('./routes/items').router;

const app = express();
const PORT = process.env.PORT || 3000;

// View engine (View layer of MVC)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets (shared CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON request bodies for API requests
app.use(express.json());

// Routes -> Controllers
app.use('/', pagesRouter);

// Item API routes
app.use('/api/items', itemsRouter);

app.listen(PORT, () => {
  console.log(`Wireframe server running at http://localhost:${PORT}`);
});
