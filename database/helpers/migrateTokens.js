const defaultDb = require('../../database/database')
const { storeToken, getToken } = require('./tokens')

async function migrateUserTokensForProviders(user, providers = ['spotify', 'discord', 'twitch'], db = defaultDb) {
  if (!user || !user._id) return
  const migrated = []
  const errors = []

  for (const provider of providers) {
    try {
      // Check if keystore already has tokens for this user/provider
      let existing = await getToken(provider, user._id).catch(() => null)
      // Fallback: some older installs may have written tokens under a 'default' account
      if (!existing) {
        const fallback = await getToken(provider, 'default').catch(() => null)
        if (fallback) {
          // copy to canonical account
          await storeToken(provider, user._id, fallback).catch(() => null)
          // re-read
          existing = await getToken(provider, user._id).catch(() => null)
          if (existing) console.log(`Found fallback keystore entry for ${provider} and copied to user ${user._id}`)
        }
      }

      // If keystore already had tokens, still set migration marker in DB so changes persist.
      if (existing) {
        try {
          const setObj = {}
          setObj[`_tokensMigrated.${provider}`] = true
          await new Promise((resolve, reject) => {
            db.users.update({ _id: user._id }, { $set: setObj }, { upsert: false }, (err, numAffected) => {
              if (err) return reject(err)
              resolve(numAffected)
            })
          })
          console.log(`Keystore already had ${provider} for ${user._id}; marker set in DB`)
          migrated.push(provider)
        } catch (e) {
          console.error(`Failed to set marker for ${provider} for user ${user._id}:`, e)
          errors.push({ provider, error: String(e) })
        }
        continue
      }

      // Detect legacy shapes on user doc. Support both nested objects and older top-level fields.
      let blob = null
      if (provider === 'spotify') {
        if (user.spotify && (user.spotify.refresh_token || user.spotify.access_token)) {
          blob = user.spotify
        } else if (user.spotifyRefreshToken || user.spotify_refresh_token || user.refresh_token) {
          // older DB shapes sometimes kept refresh token at top-level under different names
          const tok = user.spotifyRefreshToken || user.spotify_refresh_token || user.refresh_token
          blob = { refresh_token: tok }
        }
      }

      if (provider === 'discord') {
        if (user.discord && (user.discord.refresh_token || user.discord.access_token)) {
          blob = user.discord
        } else if (user.discordRefreshToken || user.discord_refresh_token) {
          const tok = user.discordRefreshToken || user.discord_refresh_token
          blob = { refresh_token: tok }
        }
      }

      if (provider === 'twitch') {
        if (user.twitch && (user.twitch.refresh_token || user.twitch.access_token)) {
          blob = user.twitch
        } else if (user.twitchRefreshToken || user.twitch_refresh_token) {
          const tok = user.twitchRefreshToken || user.twitch_refresh_token
          blob = { refresh_token: tok }
        }
      }

      if (!blob) continue

      // Store into keystore
      await storeToken(provider, user._id, blob)

      // Verify the write
      const verify = await getToken(provider, user._id).catch(() => null)
      if (!verify) {
        const msg = `Migration verification failed for ${provider} user ${user._id}`
        console.error(msg)
        errors.push({ provider, message: msg })
        continue
      }

      // Mark provider as migrated in DB to avoid destructive edits and to be auditable.
      // Set nested migration marker so multiple providers accumulate
      const setObj = {}
      setObj[`_tokensMigrated.${provider}`] = true

      await new Promise((resolve, reject) => {
        db.users.update({ _id: user._id }, { $set: setObj }, { upsert: false }, (err, numAffected) => {
          if (err) return reject(err)
          resolve(numAffected)
        })
      })

      console.log(`Migrated ${provider} for user ${user._id}`)
      migrated.push(provider)
    } catch (e) {
      console.error(`Failed to migrate ${provider} for user ${user && user._id}:`, e)
      errors.push({ provider, error: String(e) })
    }
  }

  return { migrated, errors }
}

async function migrateAllUsers(options = { compact: true, removeLegacy: false }, db = defaultDb) {
  // Try to surface which physical DB file is being used so callers can verify where changes land
  try {
    const dbFile = db && db.users && db.users.filename ? db.users.filename : 'unknown'
    console.log('Starting background token migration using DB file:', dbFile)
  } catch (e) {
    console.log('Starting background token migration (db path unknown)')
  }
  const summary = {
    usersScanned: 0,
    migrated: { spotify: 0, discord: 0, twitch: 0 },
    errors: [],
  }

  return new Promise((resolve) => {
    db.users.find({}, async (err, users) => {
      if (err) {
        console.error('Error reading users DB for migration:', err)
        summary.errors.push({ stage: 'readUsers', error: String(err) })
        return resolve(summary)
      }

      summary.usersScanned = users.length

      for (const user of users) {
        // run migrations sequentially to avoid hammering keystore
        try {
          const result = await migrateUserTokensForProviders(user, undefined, db)
          if (result && Array.isArray(result.migrated)) {
            for (const p of result.migrated) {
              if (summary.migrated[p] !== undefined) summary.migrated[p] += 1
              // Optionally remove legacy fields after successful migration
              if (options.removeLegacy) {
                try {
                  // Attempt to unset only sensitive token fields (top-level and nested) so non-sensitive data (webhook_url, ids) remains.
                  const unsetObj = {}
                  if (p === 'spotify') {
                    // top-level legacy names
                    unsetObj['spotifyAccessToken'] = true
                    unsetObj['spotifyRefreshToken'] = true
                    unsetObj['spotifyAuthorizationCode'] = true
                    unsetObj['spotify_access_token'] = true
                    unsetObj['spotify_refresh_token'] = true
                    unsetObj['refresh_token'] = true
                    // nested object fields
                    unsetObj['spotify.access_token'] = true
                    unsetObj['spotify.refresh_token'] = true
                    unsetObj['spotify.authorizationCode'] = true
                    unsetObj['spotify.authorization_code'] = true
                  }
                  if (p === 'discord') {
                    // top-level legacy names
                    unsetObj['discordRefreshToken'] = true
                    unsetObj['discord_refresh_token'] = true
                    // nested object fields
                    unsetObj['discord.accessToken'] = true
                    unsetObj['discord.refreshToken'] = true
                    unsetObj['discord.authorizationCode'] = true
                    unsetObj['discord.authorization_code'] = true
                  }
                  if (p === 'twitch') {
                    // top-level legacy names
                    unsetObj['twitchAccessToken'] = true
                    unsetObj['twitchAccessToken'] = true
                    unsetObj['twitchRefreshToken'] = true
                    unsetObj['twitch_access_token'] = true
                    unsetObj['twitch_refresh_token'] = true
                    // nested object fields
                    unsetObj['twitch.access_token'] = true
                    unsetObj['twitch.refresh_token'] = true
                    unsetObj['twitch.accessToken'] = true
                    unsetObj['twitch.refreshToken'] = true
                  }

                  // Only perform the update if we collected any keys
                  const unsetKeys = Object.keys(unsetObj)
                  if (unsetKeys.length > 0) {
                    // Also ensure we remove any lingering app-level authorization codes
                    unsetObj['appAuthorizationCode'] = true
                    unsetObj['authorizationCode'] = true
                    await new Promise((res, rej) => db.users.update({ _id: user._id }, { $unset: unsetObj }, {}, (err) => (err ? rej(err) : res())))
                  }
                } catch (e) {
                  console.error('Failed to remove legacy fields for', user._id, p, e)
                }
              }
            }
          }
          if (result && Array.isArray(result.errors) && result.errors.length > 0) {
            summary.errors.push({ _id: user._id, errors: result.errors })
          }
        } catch (e) {
          console.error('Unexpected error migrating user', user && user._id, e)
          summary.errors.push({ _id: user._id, error: String(e) })
        }
      }

      console.log('Background token migration complete.')

      // Compact the datafile so changes are persisted and old records removed from the file.
      if (options.compact !== false && db && db.users && db.users.persistence && typeof db.users.persistence.compactDatafile === 'function') {
        try {
          await new Promise((res) => db.users.persistence.compactDatafile(res))
          console.log('Database compacted to persist migration changes.')
        } catch (e) {
          console.error('Failed to compact database after migration:', e)
          summary.errors.push({ stage: 'compact', error: String(e) })
        }
      }

      resolve(summary)
    })
  })
}

async function anyUsersHaveLegacyTokens(db = defaultDb) {
  return new Promise((resolve) => {
    db.users.find({}, (err, users) => {
      if (err || !users) return resolve(false)
      for (const user of users) {
        // quick checks for common legacy fields
        if (user.spotify || user.spotifyAccessToken || user.spotifyRefreshToken || user.spotify_refresh_token || user.refresh_token) return resolve(true)
        if (user.twitch || user.twitchAccessToken || user.twitchRefreshToken || user.twitch_refresh_token || user.twitch_access_token) return resolve(true)
        if (user.discord || user.discordRefreshToken || user.discord_refresh_token) return resolve(true)
        if (user.appAuthorizationCode || user.authorizationCode) return resolve(true)
      }
      resolve(false)
    })
  })

}

module.exports = { migrateAllUsers, migrateUserTokensForProviders, anyUsersHaveLegacyTokens }

