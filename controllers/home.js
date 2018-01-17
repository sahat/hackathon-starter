/**
 * GET /
 * Home page.
 */

exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/home');
  }
  res.render('account/login', {
    title: 'Login'
  });
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
