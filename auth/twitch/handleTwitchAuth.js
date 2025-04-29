const { BrowserWindow } = require('electron')
const { URL } = require('url')
const { initTwitchAuthToken } = require('./createTwitchAccessToken')
const WebSocket = require('ws')

let authWindow
let authCode
let authError

const handleTwitchAuth = async (event, arg, mainWindow, wss) => {
	const clientId = process.env.TWITCH_CLIENT_ID
	const redirectUri = process.env.TWITCH_AUTH_REDIRECT_URL

	const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671`

	authWindow = new BrowserWindow({
		width: 800,
		height: 830,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	authWindow.loadURL(authUrl)

	authWindow.webContents.on('will-navigate', async (event, url) => {
		authError = false
		console.log('URL:', url)
		const urlObj = new URL(url)
		const code = urlObj.searchParams.get('code')
		const error = urlObj.searchParams.get('error')
		if (code) {
			console.log('CODE: ', code)
			authCode = code
			authWindow.close()
		} else if (error) {
			console.log('ERROR: ', error)
			authError = true
			authWindow.close()
		}
	})

	authWindow.on('closed', () => {
		mainWindow.webContents.send('auth-code', { auth_code_on_close: authCode })
		console.log('AUTHCODE ON CLOSE: ', authCode)
		if (authError) {
			console.log('NO AUTH CODE RETURNED: ', authError)
			wss.clients.forEach(function each(client) {
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
