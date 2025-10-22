#!/usr/bin/env node
// scripts/force-unset-legacy.js
// Usage: node scripts/force-unset-legacy.js <dbPath> <userId>

const path = require('path')
const Datastore = require('nedb')

const args = process.argv.slice(2)
const dbPath = args[0]
const userId = args[1]

if (!dbPath || !userId) {
  console.error('Usage: node scripts/force-unset-legacy.js <dbPath> <userId>')
  process.exit(2)
}

const db = new Datastore({ filename: dbPath, autoload: true })

const unsetObj = {
  'spotifyAccessToken': true,
  'spotifyRefreshToken': true,
  'spotifyAuthorizationCode': true,
  'spotify.access_token': true,
  'spotify.refresh_token': true,
  'twitchAccessToken': true,
  'twitchRefreshToken': true,
  'twitch.access_token': true,
  'twitch.refresh_token': true
}

console.log('Running $unset for user', userId)

db.update({ _id: userId }, { $unset: unsetObj }, {}, (err, num) => {
  if (err) {
    console.error('Update error', err)
    process.exit(1)
  }
  console.log('Update num:', num)
  db.findOne({ _id: userId }, (err2, doc) => {
    if (err2) {
      console.error('FindOne error', err2)
      process.exit(1)
    }
    console.log('Doc after unset:', JSON.stringify(doc, null, 2))
    // compact
    db.persistence.compactDatafile(() => {
      console.log('Compaction complete')
      process.exit(0)
    })
  })
})
