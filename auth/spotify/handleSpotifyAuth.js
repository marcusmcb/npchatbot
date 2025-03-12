const { BrowserWindow } = require('electron')
const { URL } = require('url')
const {
	generateRandomState,
} = require('../../auth/helpers/generateRandomState')
const {
	initSpotifyAuthToken,
} = require('../../auth/spotify/createSpotifyAccessToken')
const { setSpotifyUserId } = require('../../auth/spotify/setSpotifyUserId')

let spotifyAuthWindow
let spotifyAuthCode
let spotifyAuthError

const handleSpotifyAuth = async (
	event,
	arg,
	mainWindow,
	wss,
	spotifyRedirectUri
) => {
	const spotifyClientId = process.env.SPOTIFY_CLIENT_ID
	const scope = 'playlist-modify-public playlist-modify-private'
	const state = generateRandomState()
	const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyClientId}&scope=${scope}&state=${state}&redirect_uri=${spotifyRedirectUri}`

	console.log('SPOTIFY AUTH URL:', spotifyAuthUrl)
	console.log('--------------------------------------')

	spotifyAuthWindow = new BrowserWindow({
		width: 800,
		height: 830,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	spotifyAuthWindow.loadURL(spotifyAuthUrl)

	ipcMain.once('close-spotify-auth-window', () => {
		if (spotifyAuthWindow) {
			spotifyAuthWindow.close()
			spotifyAuthWindow = null
		}
	})

	spotifyAuthWindow.on('closed', async () => {
		spotifyAuthWindow = null
	})

	if (arg && arg.code) {
		spotifyAuthCode = arg.code
	}
}

module.exports = {
	handleSpotifyAuth,
}
