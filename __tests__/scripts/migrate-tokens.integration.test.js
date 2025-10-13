const fs = require('fs')
const path = require('path')

// Use test DB path via env
const TEST_DB_DIR = path.join(__dirname, '..', 'test-db')
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'users.db')

if (!fs.existsSync(TEST_DB_DIR)) fs.mkdirSync(TEST_DB_DIR, { recursive: true })
process.env.DB_PATH = TEST_DB_PATH

// Clear cached modules so they initialize using the TEST DB_PATH
delete require.cache[require.resolve('../../database/database')]
delete require.cache[require.resolve('../../database/helpers/migrateTokens')]
delete require.cache[require.resolve('../../database/helpers/tokens')]

const dbModule = require('../../database/database')
const { storeToken, getToken } = require('../../database/helpers/tokens')
const { migrateAllUsers, migrateUserTokensForProviders } = require('../../database/helpers/migrateTokens')

afterAll(() => {
  delete process.env.DB_PATH
})

test('migrates legacy tokens into keystore and removes legacy fields', async () => {
  // Insert a fake user with legacy token fields
  const user = { _id: 'migrate-1', spotify: { access_token: 'acc', refresh_token: 'ref' }, twitch: { access_token: 'tacc', refresh_token: 'tref' }, discord: { access_token: 'dacc', refresh_token: 'dref' } }

  await new Promise((resolve, reject) => dbModule.users.insert(user, (err) => (err ? reject(err) : resolve())))

  // Ensure keystore empty initially
  expect(await getToken('spotify', user._id)).toBeNull()
  expect(await getToken('twitch', user._id)).toBeNull()
  expect(await getToken('discord', user._id)).toBeNull()

  // Run migration for the single user using the test DB instance
  await migrateUserTokensForProviders(user, undefined, dbModule)

  // Verify keystore has blobs
  const s = await getToken('spotify', user._id)
  const t = await getToken('twitch', user._id)
  const d = await getToken('discord', user._id)
  expect(s).not.toBeNull()
  expect(s.refresh_token).toBe('ref')
  expect(t).not.toBeNull()
  expect(t.refresh_token).toBe('tref')
  expect(d).not.toBeNull()
  expect(d.refresh_token).toBe('dref')

  // Verify DB user has migration markers for each provider (non-destructive migration)
  const updated = await new Promise((resolve, reject) => dbModule.users.findOne({ _id: user._id }, (err, doc) => (err ? reject(err) : resolve(doc))))
  expect(updated._tokensMigrated).toBeDefined()
  expect(updated._tokensMigrated.spotify).toBe(true)
  expect(updated._tokensMigrated.twitch).toBe(true)
  expect(updated._tokensMigrated.discord).toBe(true)
})
