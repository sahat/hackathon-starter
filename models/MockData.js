const Activity = require('./Activity');

exports.mockData = (userId) => {
  const activities = [];

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  for (let i = 0; i < 15; i++) {
    const ms = new Date().getTime();
    const duration = (getRandomInt(10, 60) * 60000).toFixed(2);
    const distance = ((Math.random() + 0.5) * (duration / (5 * 60000)));
    const date = new Date(ms - (i * 86400000));
    activities.push(new Activity({
      userId,
      duration,
      date,
      distance,
      note: 'Tres bon entrainement',
      type: 'Course'
    }));
  }

  Activity.create(activities);
};
