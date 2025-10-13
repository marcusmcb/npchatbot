#!/usr/bin/env node
// scripts/offline-migrate-to-keytar.js
// Loads a NeDB datafile (normalized), iterates users, writes tokens to keytar via the project's tokens helper,
// and removes sensitive fields (or sets markers) then compacts the DB.

const path = require('path')
const fs = require('fs')
const Datastore = require('nedb')

// Reuse existing tokens helper if available
let tokensHelper
try {
  tokensHelper = require('../database/helpers/tokens')
} catch (e) {
  console.error('Failed to load tokens helper. Ensure you run this from project root with dependencies installed.')
  process.exit(1)
}

const { storeToken, getToken } = tokensHelper

async function migrateFile(dbPath, options = { removeLegacy: true }) {
  if (!fs.existsSync(dbPath)) throw new Error(`db file not found: ${dbPath}`)
  const db = new Datastore({ filename: dbPath, autoload: true })

  const users = await new Promise((resolve, reject) => db.find({}, (err, docs) => (err ? reject(err) : resolve(docs))))

  for (const user of users) {
    const id = user._id
    for (const provider of ['spotify', 'discord', 'twitch']) {
      try {
        const already = await getToken(provider, id).catch(() => null)
        if (already) continue

        let blob = null
        if (provider === 'spotify' && user.spotify) blob = user.spotify
        if (provider === 'discord' && user.discord) blob = user.discord
        if (provider === 'twitch' && user.twitch) blob = user.twitch

        if (!blob) continue

        await storeToken(provider, id, blob)
        const verify = await getToken(provider, id).catch(() => null)
        if (!verify) {
          console.error(`Verification failed for ${provider} ${id}`)
          continue
        }

        if (options.removeLegacy) {
          // Remove the legacy field and compact later
          await new Promise((res, rej) => db.update({ _id: id }, { $unset: { [provider]: true } }, {}, (err) => (err ? rej(err) : res())))
        } else {
          // Mark as migrated
          const setObj = {}
          setObj[`_tokensMigrated.${provider}`] = true
          await new Promise((res, rej) => db.update({ _id: id }, { $set: setObj }, {}, (err) => (err ? rej(err) : res())))
        }

        console.log(`Migrated ${provider} for ${id}`)
      } catch (e) {
        console.error(`Error migrating ${provider} for ${id}:`, e)
      }
    }
  }

  // compact to persist removals
  db.persistence.compactDatafile()
}

if (require.main === module) {
  const dbPath = process.argv[2] || path.join(__dirname, '..', 'users.normalized.db')
  const remove = process.argv.includes('--remove')
  migrateFile(dbPath, { removeLegacy: remove }).then(() => console.log('Done')).catch((err) => { console.error(err); process.exit(1) })
}

module.exports = { migrateFile }
