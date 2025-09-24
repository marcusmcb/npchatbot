const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const { initSpotifyAuthToken } = require('../../auth/spotify/createSpotifyAccessToken')
const db = require('../../database/database')

process.env.SPOTIFY_CLIENT_ID = 'spot-client-id'
process.env.SPOTIFY_CLIENT_SECRET = 'spot-client-secret'
process.env.SPOTIFY_REDIRECT_URI = 'https://localhost/spotify_cb'

describe('initSpotifyAuthToken', () => {
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

  afterEach(() => { mock.restore(); jest.restoreAllMocks() })

  it('inserts a new user and notifies renderer + WS', async () => {
    const token = { access_token: 'acc', refresh_token: 'ref' }
    mock.onPost('https://accounts.spotify.com/api/token').reply(200, token)

    const findOneSpy = jest.spyOn(db.users, 'findOne').mockImplementation((q, cb) => cb(null, null))
    const insertSpy = jest.spyOn(db.users, 'insert').mockImplementation((doc, cb) => cb(null, { _id: 'new', ...doc }))

    await initSpotifyAuthToken('code123', wss, mainWindow)
    await new Promise((r) => setTimeout(r, 0))

    expect(findOneSpy).toHaveBeenCalled()
    expect(insertSpy).toHaveBeenCalled()
    const insertedDoc = insertSpy.mock.calls[0][0]
    expect(insertedDoc).toMatchObject({ spotifyAccessToken: 'acc', spotifyRefreshToken: 'ref', spotifyAuthorizationCode: 'code123' })

    const authSuccess = mainWindow.webContents.sent.find(e => e.channel === 'auth-successful')
    expect(authSuccess).toBeTruthy()
    expect(wsClient.messages.some(m => m.includes('npChatbot successfully linked'))).toBe(true)
  })

  it('updates an existing user and does not send renderer auth-successful', async () => {
    const token = { access_token: 'acc2', refresh_token: 'ref2' }
    mock.onPost('https://accounts.spotify.com/api/token').reply(200, token)

    const findOneSpy = jest.spyOn(db.users, 'findOne').mockImplementation((q, cb) => cb(null, { _id: 'existing' }))
    const updateSpy = jest.spyOn(db.users, 'update').mockImplementation((q, update, opts, cb) => cb(null, 1))

    await initSpotifyAuthToken('codeXYZ', wss, mainWindow)
    await new Promise((r) => setTimeout(r, 0))

    expect(findOneSpy).toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalled()
    expect(mainWindow.webContents.sent.some(e => e.channel === 'auth-successful')).toBe(false)
    expect(wsClient.messages.some(m => m.includes('npChatbot successfully linked'))).toBe(true)
  })
})
