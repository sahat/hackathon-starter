/*
Get the home page
*/

exports.index = (req, res) => {
  // Check if user is connected
  if (req.user) {
    console.log('req.user', req.user);
    // Check if user has completed the onboarding process
    if (req.user.onboardingStatus) {
      // Redirect to /dashboard if onboarding is completed
      res.redirect('/dashboard');
    } else {
      console.log('req.user.onboardingStatus', req.user.onboardingStatus);
      // Redirect to /onboarding if onboarding is not completed
      res.redirect('/onboarding');
    }
  } else {
    // Render the home page if user is not connected
    res.render('home', {
      title: 'Home'
    });
  }
};
