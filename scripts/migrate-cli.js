#!/usr/bin/env node
// scripts/migrate-cli.js
// Interactive/automated wrapper to normalize a NeDB users.db and migrate tokens to keytar.

const path = require('path')
const fs = require('fs')
const readline = require('readline')

const { normalizeFile } = require('./normalize-users-db')
const { migrateFile } = require('./offline-migrate-to-keytar')

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans) }))
}

async function run(options) {
  const input = options.dbPath || path.join(process.cwd(), 'users.db')
  if (!fs.existsSync(input)) throw new Error(`DB file not found: ${input}`)

  const backup = input + '.bak-' + Date.now()
  console.log('Backing up', input, '→', backup)
  fs.copyFileSync(input, backup)

  const normalized = options.normalizedPath || input.replace(/\.db$/, '.normalized.db')
  console.log('Normalizing', input, '→', normalized)
  normalizeFile(input, normalized)

  console.log('Ready to migrate from', normalized)
  if (!options.yes) {
    const ans = await prompt('Proceed with migration in marker-only mode? (y/N) ')
    if (!/^y(es)?$/i.test(ans)) { console.log('Aborting.'); return }
  }

  console.log('Running migration (marker-only by default).')
  await migrateFile(normalized, { removeLegacy: !!options.remove })
  console.log('Migration completed on', normalized)

  if (options.commit) {
    const commitAnswer = options.yes ? 'y' : await prompt(`Replace original ${input} with migrated file ${normalized}? (y/N) `)
    if (/^y(es)?$/i.test(commitAnswer)) {
      const origBackup = input + '.pre-migrate-' + Date.now()
      console.log('Backing up original before commit:', input, '→', origBackup)
      fs.copyFileSync(input, origBackup)
      fs.copyFileSync(normalized, input)
      console.log('Committed migrated DB to', input)
    } else {
      console.log('Commit skipped. Review', normalized, 'manually.')
    }
  } else {
    console.log('No commit requested. Review the normalized/migrated file at', normalized)
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
