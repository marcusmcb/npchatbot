#!/usr/bin/env node
// scripts/installer-migrate.js
// Intended to be executed during installer/update time. It will:
// - Locate the existing users.db (via --db or common APP paths)
// - Backup, normalize, and run the migration in marker mode by default
// - Optionally commit the migrated DB back and optionally remove legacy fields

const path = require('path')
const fs = require('fs')
const os = require('os')
const child_process = require('child_process')

const migrateCli = path.join(__dirname, 'migrate-cli.js')

function guessDbPath() {
  // Try Electron default userData locations for npchatbot
  const platform = process.platform
  if (process.env.DB_PATH) return process.env.DB_PATH
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    return path.join(appData, 'npchatbot', 'users.db')
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'npchatbot', 'users.db')
  } else {
    // linux and others
    return path.join(os.homedir(), '.config', 'npchatbot', 'users.db')
  }
}

async function run() {
  const argv = process.argv.slice(2)
  let dbPath
  const options = { yes: false, remove: false, commit: false }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--yes' || a === '-y') options.yes = true
    else if (a === '--remove') options.remove = true
    else if (a === '--commit') options.commit = true
    else if (a === '--db') dbPath = argv[++i]
    else if (!dbPath && !a.startsWith('-')) dbPath = a
  }

  if (!dbPath) dbPath = guessDbPath()

  console.log('Installer migrate checking DB at', dbPath)
  if (!fs.existsSync(dbPath)) {
    console.log('No existing users.db found at', dbPath, '- nothing to migrate.')
    return
  }

  // Call our migrate-cli script non-interactively
  const args = [migrateCli, dbPath, '--yes']
  if (options.remove) args.push('--remove')
  if (options.commit) args.push('--commit')

  // Spawn using node from this runtime
  const node = process.execPath
  console.log('Running:', node, args.join(' '))

  const p = child_process.spawn(node, args, { stdio: 'inherit' })
  p.on('close', (code) => {
    if (code === 0) console.log('Installer migration finished successfully.')
    else console.error('Installer migration failed with code', code)
    process.exit(code)
  })
}

if (require.main === module) run().catch((err) => { console.error(err); process.exit(1) })
