#!/usr/bin/env node
// scripts/check-migration.js
// Inspect a NeDB users.db and report legacy token fields and keystore entries for each user.

const path = require('path')
const fs = require('fs')
const Datastore = require('nedb')

const args = process.argv.slice(2)
const dbPath = args[0] || path.join(__dirname, '..', 'users.db')
const userIdFilter = args[1] || null

if (!fs.existsSync(dbPath)) {
  console.error('DB file not found:', dbPath)
  process.exit(2)
}

const db = new Datastore({ filename: dbPath, autoload: true })

const { getToken } = require('../database/helpers/tokens')

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2) } catch (e) { return String(obj) }
}

function detectLegacyBlobForProvider(user, provider) {
  // Mirrors the detection logic used by migrateTokens (non-destructive)
  if (!user) return null
  if (provider === 'spotify') {
    if (user.spotify && (user.spotify.refresh_token || user.spotify.access_token)) return { type: 'nested', blob: user.spotify }
    const tok = user.spotifyRefreshToken || user.spotify_refresh_token || user.refresh_token
    if (tok) return { type: 'top', key: tok, blob: { refresh_token: tok } }
    return null
  }
  if (provider === 'discord') {
    if (user.discord && (user.discord.refresh_token || user.discord.access_token)) return { type: 'nested', blob: user.discord }
    const tok = user.discordRefreshToken || user.discord_refresh_token
    if (tok) return { type: 'top', key: tok, blob: { refresh_token: tok } }
    return null
  }
  if (provider === 'twitch') {
    if (user.twitch && (user.twitch.refresh_token || user.twitch.access_token)) return { type: 'nested', blob: user.twitch }
    const tok = user.twitchRefreshToken || user.twitch_refresh_token || user.twitch_access_token || user.twitchAccessToken
    if (tok) return { type: 'top', key: tok, blob: { refresh_token: tok } }
    return null
  }
  return null
}

db.find(userIdFilter ? { _id: userIdFilter } : {}, async (err, users) => {
  if (err) {
    console.error('Error reading DB:', err)
    process.exit(3)
  }

  if (!users || users.length === 0) {
    console.log('No users found in DB')
    process.exit(0)
  }

  for (const user of users) {
    console.log('---')
    console.log('User _id:', user._id)
    console.log('Raw doc:', pretty(user))

    for (const provider of ['spotify','discord','twitch']) {
      const detected = detectLegacyBlobForProvider(user, provider)
      const keytarBlob = await getToken(provider, user._id).catch(() => null)
      const keytarBlobDefault = await getToken(provider, 'default').catch(() => null)

      console.log(`\nProvider: ${provider}`)
      console.log('  Keystore entry (account=_id):', keytarBlob ? pretty(keytarBlob) : '<none>')
      console.log('  Keystore entry (account=default):', keytarBlobDefault ? pretty(keytarBlobDefault) : '<none>')
      if (detected) {
        console.log(`  Legacy token detected (${detected.type}) ->`, pretty(detected.blob))
      } else {
        console.log('  No legacy token fields detected in user doc')
      }
    }

    console.log('\nScan complete for user:', user._id)
  }

  process.exit(0)
})
