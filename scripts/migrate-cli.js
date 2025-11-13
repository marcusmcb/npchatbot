#!/usr/bin/env node
// scripts/migrate-cli.js
// Interactive/automated wrapper to normalize a NeDB users.db and migrate tokens to keytar.

const path = require('path')
const fs = require('fs')
const readline = require('readline')

const { migrateAllUsers } = require('../database/helpers/migrateTokens')

async function run(options) {
  console.log('Running migration against the active application DB via migrateAllUsers')
  try {
    const removeLegacy = !!options.remove
    const summary = await migrateAllUsers({ compact: true, removeLegacy })
    console.log('Migration summary:', JSON.stringify(summary, null, 2))
  } catch (e) {
    console.error('Migration failed:', e)
    throw e
  }
}

if (require.main === module) {
  const argv = process.argv.slice(2)
  const options = { yes: false, remove: false, commit: false }
  let dbPath
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--yes' || a === '-y') options.yes = true
    else if (a === '--remove') options.remove = true
    else if (a === '--commit') options.commit = true
    else if (a === '--db') { dbPath = argv[++i] }
    else if (!dbPath && !a.startsWith('-')) dbPath = a
  }
  options.dbPath = dbPath
  run(options).catch((err) => { console.error('Migration CLI failed:', err); process.exit(1) })
}

module.exports = { run }
