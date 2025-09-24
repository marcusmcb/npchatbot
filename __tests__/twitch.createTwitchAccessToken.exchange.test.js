const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const { exchangeCodeForToken } = require('../auth/twitch/createTwitchAccessToken')

process.env.TWITCH_CLIENT_ID = 'test-client-id'
process.env.TWITCH_CLIENT_SECRET = 'test-client-secret'
process.env.TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token'
process.env.TWITCH_AUTH_REDIRECT_URL = 'https://localhost/callback'

describe('Twitch exchangeCodeForToken', () => {
  let mock
  beforeEach(() => {
    mock = new MockAdapter(axios)
  })
  afterEach(() => {
    mock.restore()
  })

  it('returns token payload on success', async () => {
    const code = 'abc123'
    const responseData = { access_token: 'token', refresh_token: 'rt', scope: ['chat:read'] }
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(200, responseData)

    const result = await exchangeCodeForToken(code)
    expect(result).toEqual(responseData)
  })

  it('handles HTTP error', async () => {
    const code = 'badcode'
    mock.onPost(process.env.TWITCH_AUTH_URL).reply(400, { error: 'invalid_grant' })
    const result = await exchangeCodeForToken(code)
    expect(result).toBeUndefined()
  })
})
