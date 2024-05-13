const User = require('../models/User');

/**
 * GET /
 * Dashboard page.
 */

exports.getDashboard = async (req, res) => {
  // Function to get all saved automations from GitHub
  
  // Get the user from the database
  const user = await User.findByPk(req.user.id);
  const settings = user.getSettings();

  // Test if Github PAT is valid to fetch repo infos
  const response = await fetch(`https://api.github.com/repos/${settings.github.repository.owner}/${settings.github.repository.name}/contents/`, {
    method: 'GET',
    headers: {
      'Authorization': `token ${settings.github.token}`
    }
  });

  // Extract repo infos from response
  const automations = await response.json();
  console.log('automations', automations);
  
  res.render('dashboard', {
    title: 'Dashboard',
    automations: automations,
  });

}
