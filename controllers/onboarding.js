/**
 * GET /
 * Onboarding page.
 */
exports.getOnboarding = (req, res) => {
  res.render('onboarding', {
    title: 'Let\'s started!'
  });
};

// exports.postOnboarding = (req, res, next) => {
//   res.render('onboarding', {
//     title: 'Let\'s started!'
//   });
// };
