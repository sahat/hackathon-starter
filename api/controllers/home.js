/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  console.log(res.user);
  res.render('home', {
    title: 'Home'
  });
};
