const { BrowserWindow } = require('electron')
const { URL } = require('url')
const { initTwitchAuthToken } = require('./createTwitchAccessToken')
const WebSocket = require('ws')

let authWindow
let authCode
let authError

const handleTwitchAuth = async (event, arg, mainWindow, wss) => {
	authCode = undefined
	authError = false

	const clientId = process.env.TWITCH_CLIENT_ID
	const redirectUri = process.env.TWITCH_AUTH_REDIRECT_URL

	const encodedRedirect = encodeURIComponent(redirectUri || '')
	const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirect}&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671`

	authWindow = new BrowserWindow({
		width: 800,
		height: 830,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	authWindow.loadURL(authUrl)

	const maybeHandleCallback = (navEvent, url) => {
		try {
			if (!url) return
			console.log('URL:', url)
			const urlObj = new URL(url)
			const code = urlObj.searchParams.get('code')
			const error = urlObj.searchParams.get('error')
			if (code) {
				if (navEvent && typeof navEvent.preventDefault === 'function') {
					navEvent.preventDefault()
				}
				console.log('CODE: ', code)
				authCode = code
				authWindow.close()
				return
			}
			if (error) {
				if (navEvent && typeof navEvent.preventDefault === 'function') {
					navEvent.preventDefault()
				}
				console.log('ERROR: ', error)
				authError = true
				authWindow.close()
			}
		} catch (e) {
			// Ignore parse errors from intermediate navigations
		}
	}

	// Twitch performs a redirect back to the registered redirect URI.
	// In Electron this often comes through as `will-redirect` (not `will-navigate`).
	authWindow.webContents.on('will-redirect', maybeHandleCallback)
	authWindow.webContents.on('will-navigate', maybeHandleCallback)

	// If navigation to the localhost callback fails before we can close the window,
	// attempt to still extract the code from the failing URL.
	authWindow.webContents.on('did-fail-load', (_e, _code, _desc, failingUrl) => {
		maybeHandleCallback(null, failingUrl)
	})

	authWindow.on('closed', () => {
		mainWindow.webContents.send('auth-code', { auth_code_on_close: authCode })
		console.log('AUTHCODE ON CLOSE: ', authCode)
		if (authError) {
			console.log('NO AUTH CODE RETURNED: ', authError)
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send('npChatbot authorization with Twitch was cancelled.')
				}
			})
			authWindow = null
		} else if (authCode !== undefined) {
			console.log('AUTH CODE: ', authCode)
			initTwitchAuthToken(authCode, wss, mainWindow)
			authWindow = null
		}
	})
}

module.exports = {
	handleTwitchAuth,
}
