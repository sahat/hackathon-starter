const validator = require('validator');
const User = require('../models/User');

/**
 * GET /
 * Settings page.
 */
exports.getSettings = async (req, res) => {

  // Get the user from the database
  const user = await User.findByPk(req.user.id);
  const settings = user.getSettings();

  res.render('account/settings', {
    title: 'Update your settings',
    settings: settings,
  });
};

/**
 * POST /settings
 * Settings page.
 */
exports.postSettings = async (req, res, next) => {
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
    const response = await fetch(`https://api.github.com/repos/${username}/${req.body.floatingInputRepo.split('/')[4]}`, {
      method: 'GET',
      headers: {
        'Authorization': `token ${req.body.floatingInputPat}`
      }
    });

    // Extract repo infos from response
    const repo = await response.json();
    const repoInfos = {
      name: repo.name,
      owner: repo.owner.login,
      description: repo.description ? repo.description : '',
      creationDate: repo.created_at,
      private: repo.private,
    };

    // If the response is not 200, the PAT is invalid
    if (response.status !== 200) {
      throw new Error('Invalid GitHub personal access token.');
    }

    // If the response is 200, we can save the Github settings
    if (response.status === 200) {
      user.setSettings({
        github: {
          enabled: false,
          username: username,
          token: req.body.floatingInputPat,
        }
      });
      await user.save();
      
      req.flash('success', { msg: 'Your repo/PAT is valid!' });
      // Redirect to the next step of the onboarding and pass the repo infos
      return res.redirect(`/onboarding/nextstep?step=2&repo=${repoInfos.name}&owner=${repoInfos.owner}&description=${repoInfos.description}&creationDate=${repoInfos.creationDate}&private=${repoInfos.private}`);
    } else {
      req.flash('errors', { msg: 'An error occurred while updating your settings. Please contact me at charly@keeply.fr' });
      return res.redirect('/onboarding');
    }
  } catch (error) {
    console.error(error);
    req.flash('errors', { msg: 'An error occurred while updating your settings.' });
    return res.redirect('/onboarding');
  }
};
