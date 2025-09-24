// Jest global setup mocks for modules that expect Electron runtime
// Mock the 'electron' module so code requiring app.getPath doesn't crash in Jest
jest.mock('electron', () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  const tmp = path.join(os.tmpdir(), 'npchatbot-test')
  try {
    fs.mkdirSync(tmp, { recursive: true })
  } catch {}

  // Use per-worker DB files to avoid NeDB file rename collisions in parallel tests
  const workerId = process.env.JEST_WORKER_ID || '0'
  process.env.DB_PATH = path.join(tmp, `users-${workerId}.db`)
  process.env.PLAYLIST_DB_PATH = path.join(tmp, `playlists-${workerId}.db`)
  return {
    app: {
      getPath: () => tmp,
      on: () => {},
    },
    BrowserWindow: function () {},
    ipcMain: {
      on: () => {},
      handle: () => {},
      once: () => {},
    },
    shell: {
      openExternal: () => {},
    },
  }
})

// Mock NeDB to avoid filesystem operations during tests and coverage collection
jest.mock('nedb', () => {
  return function Datastore() {
    const store = []
    this.findOne = (query, cb) => {
      // return first doc for simplicity
      cb && cb(null, store[0] || null)
    }
    this.update = (query, update, options, cb) => {
      cb && cb(null, 1)
    }
    this.insert = (doc, cb) => {
      const docWithId = { _id: doc && doc._id ? doc._id : 'test-id', ...doc }
      store.push(docWithId)
      cb && cb(null, docWithId)
    }
  }
})
