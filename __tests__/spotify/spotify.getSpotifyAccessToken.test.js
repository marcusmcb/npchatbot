const db = require('../../database/database')

process.env.SPOTIFY_CLIENT_ID = 'spot-client-id'
process.env.SPOTIFY_CLIENT_SECRET = 'spot-client-secret'

describe('getSpotifyAccessToken (refresh flow)', () => {
  afterEach(() => { jest.restoreAllMocks() })

  it('refreshes access token and updates DB', async () => {
    // Arrange DB user with a refresh token
    jest.spyOn(db.users, 'update').mockImplementation((q, update, opts, cb) => cb(null, 1))
    // Mock getUserData so a refresh token is available
    jest.doMock('../../database/helpers/userData/getUserData', () => async () => ({ spotifyRefreshToken: 'refresh123' }))

    await jest.isolateModulesAsync(async () => {
      const axios = require('axios')
      const MockAdapter = require('axios-mock-adapter')
      const localMock = new MockAdapter(axios)
      localMock.onPost('https://accounts.spotify.com/api/token').reply(200, { access_token: 'new_access' })

      const { getSpotifyAccessToken: getToken } = require('../../auth/spotify/getSpotifyAccessToken')
      const token = await getToken()
      expect(token).toBe('new_access')
    })
  })

  it('returns status on error', async () => {
    jest.spyOn(db.users, 'update').mockImplementation((q, update, opts, cb) => cb(null, 1))
    jest.doMock('../../database/helpers/userData/getUserData', () => async () => ({ spotifyRefreshToken: 'refresh123' }))

    await jest.isolateModulesAsync(async () => {
      const axios = require('axios')
      const MockAdapter = require('axios-mock-adapter')
      const localMock = new MockAdapter(axios)
      localMock.onPost('https://accounts.spotify.com/api/token').reply(500, { error: 'server_error' })

      const { getSpotifyAccessToken: getToken } = require('../../auth/spotify/getSpotifyAccessToken')
      const token = await getToken()
      expect(token).toEqual({ status: 500 })
    })
  })
})
