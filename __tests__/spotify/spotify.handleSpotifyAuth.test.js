/**
 * Test the Spotify handle window flow: it should construct the auth URL with the
 * provided redirect URI, and close the window when the IPC event fires.
 */

describe('handleSpotifyAuth (window flow)', () => {
  const REDIRECT = 'https://localhost/spotify_cb'

  beforeEach(() => {
    jest.resetModules()
    process.env.SPOTIFY_CLIENT_ID = 'spot-client-id'
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('loads the correct Spotify auth URL and closes on IPC', async () => {
    let lastWindow = null
    const listeners = {}

    jest.doMock('electron', () => {
      const os = require('os')
      const path = require('path')
      const tmp = path.join(os.tmpdir(), 'npchatbot-test')
      class MockBrowserWindow {
        constructor() {
          this.loadURL = jest.fn()
          this._closed = false
          this._onClosed = null
          this.webContents = {}
        }
        on(event, cb) {
          if (event === 'closed') this._onClosed = cb
        }
        close() {
          this._closed = true
          if (this._onClosed) this._onClosed()
        }
        get closed() {
          return this._closed
        }
      }
      return {
        app: {
          getPath: () => tmp,
          on: () => {},
        },
        BrowserWindow: function (...args) {
          const win = new MockBrowserWindow(...args)
          lastWindow = win
          return win
        },
        ipcMain: {
          once: (channel, cb) => {
            listeners[channel] = cb
          },
        },
        __getLastWindow: () => lastWindow,
        __triggerIpc: (channel) => listeners[channel] && listeners[channel]() ,
      }
    })

    // Import under isolated modules so our mocks apply
    let handleSpotifyAuth
    await jest.isolateModulesAsync(async () => {
      ;({ handleSpotifyAuth } = require('../../auth/spotify/handleSpotifyAuth'))
    })

    const mainWindow = { webContents: { send: jest.fn() } }
    const wss = { clients: [] }

    await handleSpotifyAuth(null, null, mainWindow, wss, REDIRECT)

    const electron = require('electron')
    const win = electron.__getLastWindow()
    expect(win).toBeTruthy()
    expect(win.loadURL).toHaveBeenCalledTimes(1)
    const loadedUrl = win.loadURL.mock.calls[0][0]

    // Validate URL contents
    const u = new URL(loadedUrl)
    expect(u.hostname).toBe('accounts.spotify.com')
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('client_id')).toBe('spot-client-id')
    expect(u.searchParams.get('redirect_uri')).toBe(REDIRECT)
    const scope = u.searchParams.get('scope') || ''
    expect(scope).toContain('playlist-modify-public')
    expect(scope).toContain('playlist-modify-private')
    expect(u.searchParams.get('state')).toBeTruthy() // random state is present

    // Simulate renderer IPC asking to close the auth window
    electron.__triggerIpc('close-spotify-auth-window')
    expect(win.closed).toBe(true)
  })
})
