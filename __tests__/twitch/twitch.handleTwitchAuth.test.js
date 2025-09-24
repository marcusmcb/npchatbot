/**
 * Happy-path test for Twitch OAuth navigation callback in handleTwitchAuth.
 * We mock Electron's BrowserWindow to emit a will-navigate event containing a code
 * and ensure the module calls initTwitchAuthToken and sends the IPC message on close.
 */

describe('handleTwitchAuth (happy path)', () => {
  const REDIRECT = 'https://localhost/callback'
  const CODE = 'abc123'

  beforeEach(() => {
    jest.resetModules()
    process.env.TWITCH_CLIENT_ID = 'test-client-id'
    process.env.TWITCH_AUTH_REDIRECT_URL = REDIRECT
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it('fires initTwitchAuthToken after will-navigate with code and sends IPC on close', async () => {
    // Mock the Twitch token module before requiring the handler so the destructured import is mocked.
    const initMock = jest.fn()
    jest.doMock('../../auth/twitch/createTwitchAccessToken', () => ({
      initTwitchAuthToken: initMock,
    }))

    // Build a controllable BrowserWindow mock
    let lastWindow = null
    jest.doMock('electron', () => {
      class MockBrowserWindow {
        constructor() {
          this._willNavigate = null
          this._onClosed = null
          this.webContents = {
            on: (event, cb) => {
              if (event === 'will-navigate') this._willNavigate = cb
            },
          }
          this.loadURL = jest.fn()
        }
        on(event, cb) {
          if (event === 'closed') this._onClosed = cb
        }
        close() {
          if (this._onClosed) this._onClosed()
        }
        __emitWillNavigate(url) {
          if (this._willNavigate) this._willNavigate({}, url)
        }
      }
      return {
        BrowserWindow: function (...args) {
          const win = new MockBrowserWindow(...args)
          lastWindow = win
          return win
        },
        __getLastWindow: () => lastWindow,
      }
    })

    // Now import the handler under test in an isolated module context
    let handleTwitchAuth
    await jest.isolateModulesAsync(async () => {
      ;({ handleTwitchAuth } = require('../../auth/twitch/handleTwitchAuth'))
    })

    // Test doubles for mainWindow and wss
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
    }
    const wsClient = { readyState: 1, send: jest.fn() }
    const wss = { clients: [wsClient] }

    // Invoke handler to create window and register listeners
    await handleTwitchAuth(null, null, mainWindow, wss)

    // Emit a navigation that includes a valid authorization code
    const electron = require('electron')
    const win = electron.__getLastWindow()
    expect(win).toBeTruthy()
    win.__emitWillNavigate(`${REDIRECT}?code=${CODE}`)

    // The will-navigate handler closes the window which triggers the 'closed' listener synchronously in our mock
    // Allow any microtasks queued by the handler to run
    await new Promise((r) => setTimeout(r, 0))

    // Assert IPC message and token init call
    expect(mainWindow.webContents.send).toHaveBeenCalledWith('auth-code', {
      auth_code_on_close: CODE,
    })
    expect(initMock).toHaveBeenCalledTimes(1)
    expect(initMock).toHaveBeenCalledWith(CODE, wss, mainWindow)

    // No error broadcast should have occurred in the happy path
    expect(wsClient.send).not.toHaveBeenCalled()
  })
})
