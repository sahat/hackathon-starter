const validator = require('validator');
const User = require('../models/User');
const { set } = require('lodash');

/**
 * GET /
 * Onboarding page.
 */
exports.getOnboarding = async (req, res) => {

  // Get the user from the database
  const user = await User.findByPk(req.user.id);

  return res.render('onboarding', {
    title: 'Let\'s started!'
  });

  // Render onboarding page only if user haven't already done it
  if (user.getOnboardingStatus()) {
    return res.redirect('/dashboard');
  } else {
    res.render('onboarding', {
      title: 'Let\'s started!'
    });
  }
};

/**
 * GET /onboarding/:nextstep
 * Onboarding page.
 * @param {string} nextstep
 * @param {string} repo
 * @param {string} owner
 * @param {string} description
 */
exports.getOnboardingNextStep = (req, res) => {
  res.render('onboarding', {
    title: 'Let\'s started!',
    step: req.query.step,
    repo: req.query.repo,
    owner: req.query.owner,
    description: req.query.description,
    creationDate: req.query.creationDate,
    private: req.query.private,
  });
};

/**
 * POST /onboarding
 * Onboarding page.
 */
exports.postOnboarding = async (req, res, next) => {
  // This function receives the POST request from the onboarding form with github repo URL and PAT token
  const validationErrors = [];
  if (!validator.isURL(req.body.floatingInputRepo)) validationErrors.push({ msg: 'Please enter a valid GitHub repository URL.' });
  if (!validator.isLength(req.body.floatingInputPat, { min: 90, max: 100 })) validationErrors.push({ msg: 'Please enter a valid GitHub personal access token.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/onboarding');
  }

  try {
    // Get the user from the database
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw new Error('User not found.');
    }

    // Extract username from GitHub repo URL
    const username = req.body.floatingInputRepo.split('/')[3];

    // Test if Github PAT is valid to fetch repo infos
    try {
      const response = await fetch(`https://api.github.com/repos/${username}/${req.body.floatingInputRepo.split('/')[4]}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${req.body.floatingInputPat}`
        }
      });
      
      // Extract repo infos from response
      const repo = await response.json();
      console.log('repo', repo);
      // If the response contains an error message, we throw an error
      if (repo.message === 'Bad credentials') {
        throw new Error('Invalid GitHub personal access token.');
      }

      const repoInfos = {
        name: repo.name,
        owner: repo.owner.login,
        description: repo.description ? repo.description : '',
        creationDate: repo.created_at,
        private: repo.private,
      };
      
      
      // If the response is 200, we can save the Github settings
      user.setSettings({
        github: {
          enabled: false,
          username: username,
          token: req.body.floatingInputPat,
          repository: repoInfos,
        }
      });
      await user.save();
      
      req.flash('success', { msg: 'Your repo/PAT is valid!' });
      // Redirect to the next step of the onboarding and pass the repo infos
      return res.redirect(`/onboarding/nextstep?step=2&repo=${repoInfos.name}&owner=${repoInfos.owner}&description=${repoInfos.description}&creationDate=${repoInfos.creationDate}&private=${repoInfos.private}`);
    } catch (error) {
      console.error(error);
      req.flash('errors', { msg: error.message });
      return res.redirect('/onboarding');
    }
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while updating your settings.' });
    return res.redirect('/onboarding');
  }
};

/**
 * POST /onboarding/nextstep
 * Onboarding page.
 */
exports.postOnboardingNextStep = async (req, res, next) => {
  // This function receives the POST request from the onboarding form with the repo infos
  try {
    // Get the user from the database
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      throw new Error('User not found.');
    }

    // If user validate the repo infos, we can enable the Github integration and set onboarding status to true
    let settings = user.getSettings();
    user.setSettings({
      github: {
        enabled: true,
        username: settings.github.username,
        token: settings.github.token,
        repository: settings.github.repository,
      }
    });
    user.setOnboardingStatus(true);

    await user.save();

    req.flash('success', { msg: 'Your settings have been saved.' });
    // Redirect to the user dashboard
    return res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while updating your settings.' });
    return res.redirect('/onboarding');
  }
}