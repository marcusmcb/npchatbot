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

    // Utility to match simple queries (supports matching on _id or empty query)
    const matches = (doc, query) => {
      if (!query || Object.keys(query).length === 0) return true
      if (query._id) return doc._id === query._id
      // fallback: support shallow equality for provided props
      return Object.keys(query).every(k => doc[k] === query[k])
    }

    this.find = (query, cb) => {
      const results = store.filter((d) => matches(d, query))
      cb && cb(null, results)
    }

    this.findOne = (query, cb) => {
      const doc = store.find((d) => matches(d, query)) || null
      cb && cb(null, doc)
    }

    this.insert = (doc, cb) => {
      const docWithId = { _id: doc && doc._id ? doc._id : `id-${Math.random().toString(36).slice(2,8)}`, ...doc }
      // if an entry with same _id exists, replace it
      const idx = store.findIndex(d => d._id === docWithId._id)
      if (idx !== -1) store[idx] = docWithId
      else store.push(docWithId)
      cb && cb(null, docWithId)
    }

    const setDeep = (obj, path, value) => {
      const parts = path.split('.')
      let cur = obj
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i]
        if (cur[p] === undefined || typeof cur[p] !== 'object') cur[p] = {}
        cur = cur[p]
      }
      cur[parts[parts.length - 1]] = value
    }

    const unsetDeep = (obj, path) => {
      const parts = path.split('.')
      let cur = obj
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i]
        if (cur[p] === undefined) return
        cur = cur[p]
        if (typeof cur !== 'object') return
      }
      delete cur[parts[parts.length - 1]]
    }

    this.update = (query, updateObj, options, cb) => {
      const idx = store.findIndex(d => matches(d, query))
      const found = idx !== -1
      let numAffected = 0

      if (found) {
        const current = store[idx]
        // support modifier updates
        if (updateObj && (updateObj.$set || updateObj.$unset)) {
          const next = { ...current }
          if (updateObj.$set) {
            Object.keys(updateObj.$set).forEach(k => {
              const v = updateObj.$set[k]
              if (k.includes('.')) setDeep(next, k, v)
              else next[k] = v
            })
          }
          if (updateObj.$unset) {
            Object.keys(updateObj.$unset).forEach(k => {
              if (k.includes('.')) unsetDeep(next, k)
              else delete next[k]
            })
          }
          store[idx] = next
        } else {
          // replacement (preserve _id if not provided)
          const replacement = { _id: current._id, ...updateObj }
          store[idx] = replacement
        }

        numAffected = 1
      } else if (options && options.upsert) {
        // create a new doc
        const docToInsert = updateObj && updateObj.$set ? updateObj.$set : updateObj
        const toInsertWithId = { _id: (query && query._id) || `id-${Math.random().toString(36).slice(2,8)}`, ...docToInsert }
        store.push(toInsertWithId)
        numAffected = 1
      }

      cb && cb(null, numAffected)
    }

    this.remove = (query, options, cb) => {
      const before = store.length
      for (let i = store.length - 1; i >= 0; i--) {
        if (matches(store[i], query)) store.splice(i, 1)
      }
      const numRemoved = before - store.length
      cb && cb(null, numRemoved)
    }
  }
})

// Mock keytar so tests don't require native module rebuilds. Provide an in-memory store
jest.mock('keytar', () => {
  const store = new Map()
  return {
    setPassword: async (service, account, value) => {
      const key = `${service}::${account}`
      store.set(key, value)
      return true
    },
    getPassword: async (service, account) => {
      const key = `${service}::${account}`
      return store.has(key) ? store.get(key) : null
    },
    deletePassword: async (service, account) => {
      const key = `${service}::${account}`
      return store.delete(key)
    },
  }
})
