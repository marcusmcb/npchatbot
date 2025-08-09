const db = require('../../database');

function getDiscordTokens(callback) {
  db.users.findOne({}, (err, doc) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, doc && doc.discordTokens ? doc.discordTokens : null);
    }
  });
}

module.exports = getDiscordTokens;
