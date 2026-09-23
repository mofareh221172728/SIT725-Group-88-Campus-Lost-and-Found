'use strict';

// Standalone, loopback-only form preview. No database or application session is used.
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const app = express();
const publicPath = path.join(__dirname, '../../public');

app.get('/', (_req, res) => res.redirect('/edit-report.html?type=found&id=650000000000000000000101'));
app.get('/edit-report.html', (_req, res) => {
  const html = fs.readFileSync(path.join(publicPath, 'edit-report.html'), 'utf8');
  res.type('html').send(html.replace('</body>', '<script src="/preview-fixture.js"></script></body>'));
});
app.get('/preview-fixture.js', (_req, res) => res.sendFile(path.join(__dirname, 'edit-report-fixture.js')));
app.use(express.static(publicPath));

if (require.main === module) {
  app.listen(3001, '127.0.0.1', () => {
    console.log('Edit form preview: http://127.0.0.1:3001/edit-report.html');
    console.log('Sample data only. Changes are not saved. Press Ctrl+C to stop.');
  });
}

module.exports = app;
