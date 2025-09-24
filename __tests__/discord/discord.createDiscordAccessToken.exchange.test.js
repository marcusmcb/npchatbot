const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

describe('Discord exchangeCodeForDiscordToken', () => {
  let mock
  beforeEach(() => { mock = new MockAdapter(axios) })
  afterEach(() => { mock.restore(); jest.restoreAllMocks() })

  it('returns token payload on success', async () => {
    process.env.DISCORD_CLIENT_ID = 'disc-client-id'
    process.env.DISCORD_CLIENT_SECRET = 'disc-client-secret'
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:5003/auth/discord/callback'

    const { exchangeCodeForDiscordToken } = require('../../auth/discord/handleDiscordAuth')

    mock.onPost('https://discord.com/api/oauth2/token').reply(200, { access_token: 'acc', refresh_token: 'ref' })
    const res = await exchangeCodeForDiscordToken('code123')
    expect(res).toEqual({ access_token: 'acc', refresh_token: 'ref' })
  })

  it('returns error object on failure', async () => {
    process.env.DISCORD_CLIENT_ID = 'disc-client-id'
    process.env.DISCORD_CLIENT_SECRET = 'disc-client-secret'
    process.env.DISCORD_REDIRECT_URI = 'http://localhost:5003/auth/discord/callback'

    const { exchangeCodeForDiscordToken } = require('../../auth/discord/handleDiscordAuth')

    mock.onPost('https://discord.com/api/oauth2/token').reply(500, { error: 'server_error' })
    const res = await exchangeCodeForDiscordToken('code123')
    expect(res).toHaveProperty('error')
  })
})
