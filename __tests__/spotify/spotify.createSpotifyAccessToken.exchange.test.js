const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const { exchangeCodeForSpotifyToken } = require('../../auth/spotify/createSpotifyAccessToken')

process.env.SPOTIFY_CLIENT_ID = 'spot-client-id'
process.env.SPOTIFY_CLIENT_SECRET = 'spot-client-secret'
process.env.SPOTIFY_REDIRECT_URI = 'https://localhost/spotify_cb'

describe('Spotify exchangeCodeForSpotifyToken', () => {
  let mock
  beforeEach(() => { mock = new MockAdapter(axios) })
  afterEach(() => { mock.restore() })

  it('returns token payload on success', async () => {
    const code = 'good'
    const responseData = { access_token: 'acc', refresh_token: 'ref', scope: ['playlist-modify-public'] }
    mock.onPost('https://accounts.spotify.com/api/token').reply(200, responseData)
    const result = await exchangeCodeForSpotifyToken(code)
    expect(result).toEqual(responseData)
  })

  it('handles HTTP error and returns undefined', async () => {
    const code = 'bad'
    mock.onPost('https://accounts.spotify.com/api/token').reply(400, { error: 'invalid_grant' })
    const result = await exchangeCodeForSpotifyToken(code)
    expect(result).toBeUndefined()
  })
})
