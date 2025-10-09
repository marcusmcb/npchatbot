const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const { initTwitchAuthToken } = require('../../auth/twitch/createTwitchAccessToken')
const db = require('../../database/database')

process.env.TWITCH_CLIENT_ID = 'test-client-id'
process.env.TWITCH_CLIENT_SECRET = 'test-client-secret'
process.env.TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token'

describe('initTwitchAuthToken', () => {
  let mock
  let wss
  let wsClient
  let mainWindow

  beforeEach(() => {
    mock = new MockAdapter(axios)
    wsClient = {
      readyState: 1, // WebSocket.OPEN
      messages: [],
      send(msg) {
        this.messages.push(msg)
      },
    }
    wss = { clients: [wsClient] }
    mainWindow = {
      webContents: {
        sent: [],
        send(channel, payload) {
          this.sent.push({ channel, payload })
        },
      },
    }
  })

  afterEach(() => {
    mock.restore()
    jest.restoreAllMocks()
  })

  it('inserts a new user and notifies renderer and websocket', async () => {
    // Mock token exchange success
    const token = { access_token: 'new_token', refresh_token: 'new_refresh' }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, token)

    // Spy on insert to capture doc
    const insertSpy = jest.spyOn(db.users, 'insert').mockImplementation((doc, cb) => {
      cb && cb(null, { _id: 'abc123', ...doc })
    })

    // Ensure findOne returns no user
    const findOneSpy = jest.spyOn(db.users, 'findOne').mockImplementation((q, cb) => cb(null, null))

    await initTwitchAuthToken('code123', wss, mainWindow)
    // Allow callbacks to run
    await new Promise((r) => setTimeout(r, 0))

    expect(findOneSpy).toHaveBeenCalled()
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const insertedDoc = insertSpy.mock.calls[0][0]
    // Tokens are stored in keystore only; DB insert should not contain raw tokens
    expect(insertedDoc).not.toHaveProperty('twitchAccessToken')
    expect(insertedDoc).not.toHaveProperty('twitchRefreshToken')
    expect(insertedDoc).not.toHaveProperty('appAuthorizationCode')

    // Renderer notified
  // Renderer is notified, but payload must not include sensitive tokens
  expect(mainWindow.webContents.sent.some(e => e.channel === 'auth-successful')).toBe(true)
  const authSuccess = mainWindow.webContents.sent.find(e => e.channel === 'auth-successful')
  expect(authSuccess.payload).toMatchObject({ _id: 'abc123' })

    // WS broadcast sent
    expect(wsClient.messages.some(m => m.includes('npChatbot successfully linked'))).toBe(true)
  })

  it('updates an existing user and does not notify renderer', async () => {
    const token = { access_token: 'upd_token', refresh_token: 'upd_refresh' }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, token)

    // findOne returns a user
    const findOneSpy = jest.spyOn(db.users, 'findOne').mockImplementation((q, cb) => cb(null, { _id: 'existing' }))

    const updateSpy = jest.spyOn(db.users, 'update').mockImplementation((q, update, opts, cb) => {
      cb && cb(null, 1)
    })

    await initTwitchAuthToken('codeXYZ', wss, mainWindow)
    await new Promise((r) => setTimeout(r, 0))

  expect(findOneSpy).toHaveBeenCalled()
  // DB update should not be called since tokens are stored in keystore only
  expect(updateSpy).not.toHaveBeenCalled()

    // No renderer auth-successful message in update path
    expect(mainWindow.webContents.sent.some(e => e.channel === 'auth-successful')).toBe(false)

    // WS broadcast still sent
    expect(wsClient.messages.some(m => m.includes('npChatbot successfully linked'))).toBe(true)
  })
})
