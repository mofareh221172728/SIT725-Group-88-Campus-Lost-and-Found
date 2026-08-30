// controllers/pagesController.js
// Each function renders one wireframe screen. Keeping these as separate
// controller actions (rather than one big router) is what makes this MVC:
// routes map a URL to a controller action, the controller picks a view,
// and later a Model (e.g. Mongoose) would sit between the two supplying data.

exports.landing = (req, res) => {
  res.render('landing');
};

exports.browse = (req, res) => {
  // In the real app: fetch active reports from the Report model here,
  // e.g. const reports = await Report.find({ status: 'Active' });
  res.render('browse');
};

exports.createReport = (req, res) => {
  res.render('create-report');
};

exports.itemDetail = (req, res) => {
  // In the real app: const report = await Report.findById(req.params.id);
  res.render('item-detail');
};

exports.searchFilter = (req, res) => {
  res.render('search-filter');
};

exports.myReports = (req, res) => {
  // In the real app: fetch reports where owner === req.user.id
  res.render('my-reports');
};
