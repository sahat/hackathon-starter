/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home',
  });
};

exports.post = (req, res) => {
  res.render('posts', {
    data: {
      status: 200,
    },
  });
};
