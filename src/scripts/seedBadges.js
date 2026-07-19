require('dotenv').config();
const { seedBadges } = require('../utils/badges');

seedBadges()
  .then(() => { console.log('Done!'); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
