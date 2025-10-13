const defaultDb = require('../../database/database')
const { storeToken, getToken } = require('./tokens')

async function migrateUserTokensForProviders(user, providers = ['spotify', 'discord', 'twitch'], db = defaultDb) {
  if (!user || !user._id) return

  for (const provider of providers) {
    try {
      // Skip if keystore already has tokens for this user/provider
      const existing = await getToken(provider, user._id).catch(() => null)
      if (existing) continue

      // Detect legacy shapes on user doc
      let blob = null
      if (provider === 'spotify' && user.spotify && (user.spotify.refresh_token || user.spotify.access_token)) {
        blob = user.spotify
      }
      if (provider === 'discord' && user.discord && (user.discord.refresh_token || user.discord.access_token)) {
        blob = user.discord
      }
      if (provider === 'twitch' && user.twitch && (user.twitch.refresh_token || user.twitch.access_token)) {
        blob = user.twitch
      }

      if (!blob) continue

      // Store into keystore
      await storeToken(provider, user._id, blob)

      // Verify the write
      const verify = await getToken(provider, user._id).catch(() => null)
      if (!verify) {
        console.error(`Migration verification failed for ${provider} user ${user._id}`)
        continue
      }

      // Mark provider as migrated in DB to avoid destructive edits and to be auditable.
      // Set nested migration marker so multiple providers accumulate
      const setObj = {}
      setObj[`_tokensMigrated.${provider}`] = true

      await new Promise((resolve, reject) => {
        db.users.update({ _id: user._id }, { $set: setObj }, { upsert: false }, (err, numAffected) => {
          if (err) return reject(err)
          // read back immediately (debug)
          db.users.findOne({ _id: user._id }, (err2, doc) => {
            if (err2) console.error('DEBUG: findOne after marker set error', err2)
            else console.log('DEBUG: user after marker set ->', doc)
            resolve(numAffected)
          })
        })
      })

      console.log(`Migrated ${provider} for user ${user._id} (marker set)`)
    } catch (e) {
      console.error(`Failed to migrate ${provider} for user ${user && user._id}:`, e)
    }
  }
}

async function migrateAllUsers(options = {}, db = defaultDb) {
  console.log('Starting background token migration...')
  return new Promise((resolve) => {
    db.users.find({}, async (err, users) => {
      if (err) {
        console.error('Error reading users DB for migration:', err)
        return resolve()
      }

      for (const user of users) {
        // run migrations sequentially to avoid hammering keystore
        // but keep it reasonably quick for small DBs.
        // Do not block startup; this runs in the background.
        await migrateUserTokensForProviders(user, undefined, db)
      }

      console.log('Background token migration complete.')
      resolve()
    })
  })
}

module.exports = { migrateAllUsers, migrateUserTokensForProviders }
