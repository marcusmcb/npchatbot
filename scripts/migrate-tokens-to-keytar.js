// Ensure the DB layer uses a filesystem path instead of Electron app paths
// when running this migration script under plain `node` (no Electron).
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const db = require('../database/database')
const { storeToken } = require('../database/helpers/tokens')

async function migrate() {
  console.log('Starting token migration...')

  db.users.find({}, async (err, users) => {
    if (err) {
      console.error('Error reading users DB:', err)
      process.exit(1)
    }

    for (const user of users) {
      try {
        if (user.spotify && (user.spotify.refresh_token || user.spotify.access_token)) {
          await storeToken('spotify', user._id, user.spotify)
          delete user.spotify
          db.users.update({ _id: user._id }, user, {}, () => {})
          console.log(`Migrated spotify for user ${user._id}`)
        }
        if (user.discord && (user.discord.access_token || user.discord.refresh_token)) {
          await storeToken('discord', user._id, user.discord)
          delete user.discord
          db.users.update({ _id: user._id }, user, {}, () => {})
          console.log(`Migrated discord for user ${user._id}`)
        }
        if (user.twitch && (user.twitch.access_token || user.twitch.refresh_token)) {
          await storeToken('twitch', user._id, user.twitch)
          delete user.twitch
          db.users.update({ _id: user._id }, user, {}, () => {})
          console.log(`Migrated twitch for user ${user._id}`)
        }
      } catch (e) {
        console.error('Failed to migrate for user', user._id, e)
      }
    }

    console.log('Migration complete.')
    process.exit(0)
  })
}

migrate()
