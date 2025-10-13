#!/usr/bin/env node
// scripts/normalize-users-db.js
// Reads a NeDB datafile (newline-delimited JSON), builds a map of last document per _id,
// writes a new normalized file containing only the latest docs (one JSON per line).

const fs = require('fs')
const path = require('path')

function normalizeFile(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) throw new Error(`input file not found: ${inputPath}`)
  const data = fs.readFileSync(inputPath, 'utf8')
  const lines = data.split(/\r?\n/).filter(Boolean)
  const map = new Map()

  for (const line of lines) {
    try {
      const obj = JSON.parse(line)
      if (obj && obj._id) map.set(obj._id, obj)
    } catch (e) {
      console.error('Skipping invalid JSON line:', line)
    }
  }

  const outLines = []
  for (const doc of map.values()) outLines.push(JSON.stringify(doc))

  fs.writeFileSync(outputPath, outLines.join('\n') + '\n', { encoding: 'utf8' })
}

if (require.main === module) {
  const input = process.argv[2] || path.join(__dirname, '..', 'users.db')
  const output = process.argv[3] || path.join(__dirname, '..', 'users.normalized.db')

  const backup = input + '.bak-' + Date.now()
  console.log('Backing up', input, 'to', backup)
  fs.copyFileSync(input, backup)

  console.log('Normalizing', input, '→', output)
  normalizeFile(input, output)
  console.log('Done. Review', output, 'then replace original if desired.')
}

module.exports = { normalizeFile }
