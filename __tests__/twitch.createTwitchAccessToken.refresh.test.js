const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const { getTwitchRefreshToken } = require('../auth/twitch/createTwitchAccessToken')

process.env.TWITCH_CLIENT_ID = 'test-client-id'
process.env.TWITCH_CLIENT_SECRET = 'test-client-secret'
process.env.TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token'

describe('Twitch getTwitchRefreshToken', () => {
  let mock
  beforeEach(() => { mock = new MockAdapter(axios) })
  afterEach(() => { mock.restore() })

  it('returns token payload on success', async () => {
    const responseData = { access_token: 'new_access', scope: ['chat:read'] }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, responseData)
    const res = await getTwitchRefreshToken('refresh_value')
    expect(res).toEqual(responseData)
  })

  it('handles HTTP error', async () => {
    const errorBody = { error: 'server_error' }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(500, errorBody)
    const res = await getTwitchRefreshToken('refresh_value')
    expect(res).toEqual(errorBody)
  })
})
