/**
 * GET /
 * Home page.
 */

exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/home');
  }
  return res.redirect('/login');
};
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};

//
// exports.index = (req, res) => {
//   return res.redirect('/');
//   res.render('home', {
//     title: 'Home'
//   });
// };
