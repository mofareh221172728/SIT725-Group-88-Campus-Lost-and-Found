// routes/pages.js
const express = require('express');
const router = express.Router();
const pagesController = require('../controllers/pagesController');

router.get('/', pagesController.landing);
router.get('/browse', pagesController.browse);
router.get('/create-report', pagesController.createReport);
router.get('/item-detail', pagesController.itemDetail);
router.get('/search-filter', pagesController.searchFilter);
router.get('/my-reports', pagesController.myReports);

module.exports = router;
