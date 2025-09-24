describe('sharePlaylistToDiscord', () => {
  const mkEvent = () => ({ reply: jest.fn() })

  it('replies success on 204/200', async () => {
    await jest.isolateModulesAsync(async () => {
      const axios = require('axios')
      const MockAdapter = require('axios-mock-adapter')
      const localMock = new MockAdapter(axios)
      localMock.onPost('https://webhook.example/').reply(204)

      const { sharePlaylistToDiscord: share } = require('../../database/helpers/playlists/sharePlaylistToDiscord')
      const event = mkEvent()
      await share('https://spotify.example','https://webhook.example/','channel','2024-09-01',event)
      expect(event.reply).toHaveBeenCalledWith('share-playlist-to-discord-response', { success: true })
      localMock.restore()
    })
  })

  it('replies failure on error', async () => {
    await jest.isolateModulesAsync(async () => {
      const axios = require('axios')
      const MockAdapter = require('axios-mock-adapter')
      const localMock = new MockAdapter(axios)
      localMock.onPost('https://webhook.example/').reply(500, { error: 'server_error' })

      const { sharePlaylistToDiscord: share } = require('../../database/helpers/playlists/sharePlaylistToDiscord')
      const event = mkEvent()
      await share('https://spotify.example','https://webhook.example/','channel','2024-09-01',event)
      expect(event.reply).toHaveBeenCalledWith('share-playlist-to-discord-response', { success: false })
      localMock.restore()
    })
  })
})
