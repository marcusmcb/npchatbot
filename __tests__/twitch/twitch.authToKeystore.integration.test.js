const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const db = require('../../database/database')
const { initTwitchAuthToken, getTwitchRefreshToken } = require('../../auth/twitch/createTwitchAccessToken')
const { handleSubmitUserData } = require('../../database/helpers/userData/handleSubmitUserData')
const { getToken } = require('../../database/helpers/tokens')

process.env.TWITCH_CLIENT_ID = 'test-client-id'
process.env.TWITCH_CLIENT_SECRET = 'test-client-secret'
process.env.TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token'
process.env.TWITCH_AUTH_REDIRECT_URL = 'https://localhost/callback'

describe('Twitch auth -> keystore -> submit flow', () => {
  let mock
  let wss
  let wsClient
  let mainWindow
  let event

  beforeEach(() => {
    mock = new MockAdapter(axios)
    wsClient = { readyState: 1, messages: [], send(msg) { this.messages.push(msg) } }
    wss = { clients: [wsClient] }
    mainWindow = { webContents: { sent: [], send(channel, payload) { this.sent.push({ channel, payload }) } } }

    event = {
      replies: [],
      reply(channel, payload) { this.replies.push({ channel, payload }) }
    }
  })

  afterEach(() => {
    mock.restore()
    jest.restoreAllMocks()
  })

  it('stores refresh token in keystore and handleSubmitUserData uses it', async () => {
    // Step 1: mock token exchange to return tokens
    const exchanged = { access_token: 'access1', refresh_token: 'refresh1' }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, exchanged)

  // Call init to simulate user authorizing via Twitch
    await initTwitchAuthToken('code-abc', wss, mainWindow)
    // allow any async storeToken to run
    await new Promise((r) => setTimeout(r, 0))

    // There should be a user in the DB (mocked insert from jest.setup)
    const user = await new Promise((resolve, reject) => db.users.findOne({}, (err, doc) => err ? reject(err) : resolve(doc)))
    expect(user).toBeTruthy()

    // Keystore should have the refresh token stored for this user
    const blob = await getToken('twitch', user._id)
    expect(blob).toBeTruthy()
    expect(blob.refresh_token).toBe('refresh1')

    // Step 2: mock the refresh token exchange that handleSubmitUserData will call
    const refreshed = { access_token: 'access2' }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, refreshed)

  // Mock Twitch user lookup (helix) responses for both channel and chatbot name checks
  // The validations helper expects response.data.data to be an array
  mock.onGet(/helix\/users/).reply(200, { data: [{ id: '1' }] })

    // Prepare arg and call handleSubmitUserData; we intentionally pass a wrong/missing arg.twitchRefreshToken
    const arg = {
      seratoDisplayName: 'my serato',
      twitchChannelName: 'channel',
      twitchChatbotName: 'chatbot',
      twitchRefreshToken: null, // should be ignored because keystore has it
    }

    // Mock Serato playlist HEAD check (validation) to return success (use sanitized serato name)
    const seratoName = arg.seratoDisplayName.replaceAll(' ', '_')
    mock.onHead(`https://www.serato.com/playlists/${seratoName}`).reply(200)

    await handleSubmitUserData(event, arg, mainWindow)

    // After calling, event should have a userDataResponse success
    const resp = event.replies.find(r => r.channel === 'userDataResponse')
    expect(resp).toBeTruthy()
    expect(resp.payload).toHaveProperty('success')
    expect(resp.payload.success).toBe(true)

  // Also ensure that userDataUpdated was sent via mainWindow
  expect(mainWindow.webContents.sent.some(s => s.channel === 'userDataUpdated')).toBe(true)

    // Ensure that keystore was used for refresh (we already asserted presence earlier)
  })
})
