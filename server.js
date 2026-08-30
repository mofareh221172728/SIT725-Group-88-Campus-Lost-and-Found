// server.js  entry point
const express = require('express');
const path = require('path');
const pagesRouter = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine (View layer of MVC)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets (shared CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Routes -> Controllers
app.use('/', pagesRouter);

app.listen(PORT, () => {
  console.log(`Wireframe server running at http://localhost:${PORT}`);
});
