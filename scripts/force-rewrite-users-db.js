#!/usr/bin/env node
// scripts/force-rewrite-users-db.js
// Atomically rewrite a NeDB users.db from sanitized user documents.
// Usage: node scripts/force-rewrite-users-db.js <dbPath>
// Creates a backup at <dbPath>.bak-<ts> before replacing.

const fs = require('fs')
const path = require('path')
const Datastore = require('nedb')

async function readAllDocs(dbPath) {
  const db = new Datastore({ filename: dbPath, autoload: true })
  return new Promise((resolve, reject) => db.find({}, (err, docs) => (err ? reject(err) : resolve(docs))))
}

function sanitizeDoc(doc) {
  // Remove only sensitive token-like fields. Keep webhook urls and non-sensitive settings.
  const sanitized = JSON.parse(JSON.stringify(doc))
  const sensitiveToplevel = [
    'spotifyAccessToken','spotifyRefreshToken','spotifyAuthorizationCode','spotify_access_token','spotify_refresh_token','refresh_token',
    'twitchAccessToken','twitchRefreshToken','twitch_access_token','twitch_refresh_token','twitchAccessToken',
    'appAuthorizationCode','authorizationCode'
  ]
  for (const k of sensitiveToplevel) {
    if (k in sanitized) delete sanitized[k]
  }

  // Nested provider objects: remove token fields inside spotify, twitch, discord
  if (sanitized.spotify && typeof sanitized.spotify === 'object') {
    delete sanitized.spotify.access_token
    delete sanitized.spotify.refresh_token
    delete sanitized.spotify.authorizationCode
    delete sanitized.spotify.authorization_code
  }
  if (sanitized.twitch && typeof sanitized.twitch === 'object') {
    delete sanitized.twitch.access_token
    delete sanitized.twitch.refresh_token
    delete sanitized.twitch.accessToken
    delete sanitized.twitch.refreshToken
  }
  if (sanitized.discord && typeof sanitized.discord === 'object') {
    delete sanitized.discord.accessToken
    delete sanitized.discord.refreshToken
    delete sanitized.discord.authorizationCode
    delete sanitized.discord.authorization_code
  }

  // Keep _tokensMigrated and other markers intact
  return sanitized
}

async function writeSanitizedDb(tempPath, docs) {
  const db = new Datastore({ filename: tempPath, autoload: true })
  // Ensure file starts empty by removing existing temp if present
  await new Promise((res, rej) => {
    db.remove({}, { multi: true }, (err) => (err ? rej(err) : res()))
  })
  // Insert sanitized docs
  return new Promise((resolve, reject) => {
    db.insert(docs, (err) => {
      if (err) return reject(err)
      // Compact to flush to disk
      db.persistence.compactDatafile(() => resolve())
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  const dbPath = args[0]
  if (!dbPath) {
    console.error('Usage: node scripts/force-rewrite-users-db.js <dbPath>')
    process.exit(2)
  }
  if (!fs.existsSync(dbPath)) {
    console.error('DB file not found:', dbPath)
    process.exit(3)
  }

  const ts = Date.now()
  const backupPath = `${dbPath}.bak-${ts}`
  const tmpPath = `${dbPath}.tmp-${ts}`

  console.log('Reading original DB:', dbPath)
  const docs = await readAllDocs(dbPath)
  console.log(`Found ${docs.length} docs; sanitizing and writing to temp DB: ${tmpPath}`)

  const sanitized = docs.map(sanitizeDoc)

  try {
    // Write temp DB
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    await writeSanitizedDb(tmpPath, sanitized)

    // Backup original
    fs.copyFileSync(dbPath, backupPath)
    console.log('Backup created at:', backupPath)

    // Replace original with temp (atomic-ish)
    // On Windows, rename will fail if target exists; remove original first
    fs.unlinkSync(dbPath)
    fs.renameSync(tmpPath, dbPath)
    console.log('Replaced original DB with sanitized DB.')

    // Final compact on final DB
    const finalDb = new Datastore({ filename: dbPath, autoload: true })
    await new Promise((res) => finalDb.persistence.compactDatafile(res))
    console.log('Final compaction complete.')

    // Print sample doc
    const finalDocs = await new Promise((res, rej) => finalDb.find({}, (err, d) => (err ? rej(err) : res(d))))
    console.log('Sanitized docs sample:', JSON.stringify(finalDocs.slice(0,3), null, 2))
    console.log('Done')
  } catch (e) {
    console.error('Failed to rewrite DB; attempting restore from backup if present', e)
    try {
      if (fs.existsSync(backupPath)) {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
        fs.copyFileSync(backupPath, dbPath)
        console.log('Restored original DB from backup at', backupPath)
      }
    } catch (e2) {
      console.error('Restore failed', e2)
    }
    process.exit(1)
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1) })
