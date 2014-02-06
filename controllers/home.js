/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
console.log(req.i18n.lng());
  res.render('home', {
    title: req.i18n.t('common.home')
  });
};
