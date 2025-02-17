/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home',
    homeUrl: process.env.BASE_URL,
  });
};
