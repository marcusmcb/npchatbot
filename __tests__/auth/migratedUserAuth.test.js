const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const { initTwitchAuthToken } = require('../../auth/twitch/createTwitchAccessToken')
const { initSpotifyAuthToken } = require('../../auth/spotify/createSpotifyAccessToken')
const db = require('../../database/database')

describe('migrated user auth behavior', () => {
  let mock
  let wss
  let wsClient
  let mainWindow

  beforeEach(() => {
    mock = new MockAdapter(axios)
    wsClient = { readyState: 1, messages: [], send(msg) { this.messages.push(msg) } }
    wss = { clients: [wsClient] }
    mainWindow = { webContents: { sent: [], send(channel, payload) { this.sent.push({ channel, payload }) } } }
  })

  afterEach(() => {
    mock.restore()
    jest.restoreAllMocks()
  })

  it('does not update DB for existing Twitch user when migrated', async () => {
    process.env.TWITCH_CLIENT_ID = 'test-client-id'
    process.env.TWITCH_CLIENT_SECRET = 'test-client-secret'
    process.env.TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token'
    process.env.TWITCH_AUTH_REDIRECT_URL = 'https://localhost/callback'

    const token = { access_token: 'tkt', refresh_token: 'trk' }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, token)

    const findOneSpy = jest.spyOn(db.users, 'findOne').mockImplementation((q, cb) => cb(null, { _id: 'existing', _tokensMigrated: { twitch: true } }))
    const updateSpy = jest.spyOn(db.users, 'update').mockImplementation((q, update, opts, cb) => cb && cb(null, 1))

    await initTwitchAuthToken('code123', wss, mainWindow)
    await new Promise((r) => setTimeout(r, 0))

    expect(findOneSpy).toHaveBeenCalled()
    // Because user is migrated, no DB update should occur
    expect(updateSpy).not.toHaveBeenCalled()
    // No renderer auth-successful message on update path
    expect(mainWindow.webContents.sent.some(e => e.channel === 'auth-successful')).toBe(false)
    // websocket still informed
    expect(wsClient.messages.some(m => m.includes('npChatbot successfully linked'))).toBe(true)
  })

  it('does not update DB for existing Spotify user when migrated', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'spot-client-id'
    process.env.SPOTIFY_CLIENT_SECRET = 'spot-client-secret'
    process.env.SPOTIFY_REDIRECT_URI = 'https://localhost/spotify_cb'

    const token = { access_token: 'sacc', refresh_token: 'sref' }
    mock.onPost('https://accounts.spotify.com/api/token').reply(200, token)

    const findOneSpy = jest.spyOn(db.users, 'findOne').mockImplementation((q, cb) => cb(null, { _id: 'existing', _tokensMigrated: { spotify: true } }))
    const updateSpy = jest.spyOn(db.users, 'update').mockImplementation((q, update, opts, cb) => cb && cb(null, 1))

    await initSpotifyAuthToken('codeXYZ', wss, mainWindow)
    await new Promise((r) => setTimeout(r, 0))

    expect(findOneSpy).toHaveBeenCalled()
    // Because user is migrated, no DB update should occur
    expect(updateSpy).not.toHaveBeenCalled()
    // No renderer auth-successful message on update path
    expect(mainWindow.webContents.sent.some(e => e.channel === 'auth-successful')).toBe(false)
    // websocket still informed
    expect(wsClient.messages.some(m => m.includes('npChatbot successfully linked'))).toBe(true)
  })
})
