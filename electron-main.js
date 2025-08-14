const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const WebSocket = require('ws')
const express = require('express')
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const fetch = (...args) =>
	import('node-fetch').then((mod) => mod.default(...args))

// bot config/initialization, and utility methods
const db = require('./database/database')
const loadConfigurations = require('./config')
const initializeBot = require('./index')
const { handleStartBotScript } = require('./bot-scripts/handleStartBotScript')
const { handleStopBotScript } = require('./bot-scripts/handleStopBotScript')
const logToFile = require('./scripts/logger')

// auth handlers and user data methods
const { handleSpotifyAuth } = require('./auth/spotify/handleSpotifyAuth')
const {
	initSpotifyAuthToken,
} = require('./auth/spotify/createSpotifyAccessToken')
const { setSpotifyUserId } = require('./auth/spotify/setSpotifyUserId')
const { handleTwitchAuth } = require('./auth/twitch/handleTwitchAuth')
const {
	handleGetUserData,
} = require('./database/helpers/userData/handleGetUserData')
const {
	handleSubmitUserData,
} = require('./database/helpers/userData/handleSubmitUserData')

// discord auth handler
const {
	getDiscordAuthUrl,
	initDiscordAuthToken,
} = require('./auth/discord/handleDiscordAuth')

// serato live playlist status validation
const {
	validateLivePlaylist,
} = require('./database/helpers/validations/validateLivePlaylist')

// user data handler
const getUserData = require('./database/helpers/userData/getUserData')

/* PLAYLIST HANDLERS */
const {
	createPlaylistSummary,
} = require('./bot-assets/summary/createPlaylistSummary')
const {
	getCurrentPlaylistSummary,
} = require('./bot-assets/command-use/commandUse')
const {
	getPlaylistSummaries,
} = require('./database/helpers/playlistSummaries/getPlaylistSummaries')
const {
	getPlaylistSummaryData,
} = require('./database/helpers/playlistSummaries/getPlaylistSummaryData')

const { addPlaylist } = require('./database/helpers/playlists/addPlaylist')

const {
	sharePlaylistToDiscord,
} = require('./database/helpers/playlists/sharePlaylistToDiscord')

const {
	deletePlaylist,
} = require('./database/helpers/playlists/deletePlaylist')

// check if the app is started by Squirrel.Windows
if (require('electron-squirrel-startup')) app.quit()

// https cert options, used during twitch & spotify auth processes
const options = {
	key: fs.readFileSync(path.join(__dirname, './server.key')),
	cert: fs.readFileSync(path.join(__dirname, './server.cert')),
}

// load environment variables & set path
const envPath = path.join(__dirname, '.env')
dotenv.config({ path: envPath })

// environment variables
let mainWindow
let tmiInstance
let serverInstance
let botProcess = false
let isConnected = false

// server config and middleware
const server = express()
const PORT = process.env.PORT || 5002
server.use(bodyParser.json())
server.use(cors())

const isDev = !app.isPackaged
// const isDev = true;
process.env.NODE_ENV = isDev ? 'development' : 'production'

// socket config for auth responses
const wss = new WebSocket.Server({ port: 8080 })

// Add waitForServer before createWindow
const waitForServer = async (url, timeout = 15000) => {
	const start = Date.now()
	while (Date.now() - start < timeout) {
		try {
			await fetch(url)
			return true
		} catch {
			await new Promise((res) => setTimeout(res, 300))
		}
	}
	return false
}

// utility method to start app server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

// Discord auth callback PORT value
const DISCORD_HTTP_PORT = 5003

// Discord auth callback server
const discordHttpServer = http.createServer(async (req, res) => {
	if (req.url.startsWith('/auth/discord/callback')) {
		const urlObj = new URL(req.url, `http://127.0.0.1:${DISCORD_HTTP_PORT}`)
		const code = urlObj.searchParams.get('code')
		const error = urlObj.searchParams.get('error')
		const state = urlObj.searchParams.get('state')

		if (error) {
			console.log('Discord Auth Error:', error)
			res.writeHead(400, { 'Content-Type': 'text/plain' })
			res.end('Discord authorization failed.')
			return
		}

		if (!code) {
			console.log('No authorization code received.')
			res.writeHead(400, { 'Content-Type': 'text/plain' })
			res.end('No authorization code received.')
			return
		}

		if (code) {
			await initDiscordAuthToken(code, wss, mainWindow)
			setTimeout(() => {
				console.log('Discord auth token initialized.')
			}, 100)
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.end('Discord authorization successful! You may close this window.')
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' })
		res.end('Not Found')
	}
})

discordHttpServer.listen(DISCORD_HTTP_PORT, () => {
	console.log(
		`Discord auth callback HTTP server running on port ${DISCORD_HTTP_PORT}`
	)
})

// http server and port for Spotify auth
const HTTP_PORT = 5001

const httpServer = http.createServer(async (req, res) => {
	if (req.url.startsWith('/auth/spotify/callback')) {
		const urlObj = new URL(req.url, `http://127.0.0.1:${HTTP_PORT}`)
		const code = urlObj.searchParams.get('code')
		const error = urlObj.searchParams.get('error')
		const state = urlObj.searchParams.get('state')

		console.log('Received Spotify auth callback:', { code, error, state })

		if (error) {
			console.error('Spotify Auth Error:', error)
			res.writeHead(400, { 'Content-Type': 'text/plain' })
			res.end('Authorization failed. Please try again.')
			return
		}

		if (!code) {
			console.error('No authorization code received.')
			res.writeHead(400, { 'Content-Type': 'text/plain' })
			res.end('No authorization code received.')
			return
		}

		console.log('Received authorization code:', code)

		if (code) {
			await initSpotifyAuthToken(code, wss, mainWindow)
			setTimeout(async () => {
				await setSpotifyUserId()
			}, 100)
		}

		mainWindow.webContents.send('close-spotify-auth-window')

		res.writeHead(200, { 'Content-Type': 'text/plain' })
		res.end('Authorization successful! You may close this window.')
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' })
		res.end('Not Found')
	}
})

httpServer.listen(HTTP_PORT, () => {
	console.log(`Spotify auth callback HTTP server running on port ${HTTP_PORT}`)
})

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

ipcMain.on('open-auth-settings', (event, url) => {
	shell.openExternal(url)
})

ipcMain.on('get-user-data', async (event, arg) => {
	handleGetUserData(event, arg)
})

// is this listener being used?
ipcMain.on('userDataUpdated', () => {
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('open-spotify-url', (event, spotifyUrl) => {
	shell.openExternal(spotifyUrl)
})

ipcMain.on('open-twitch-auth-url', async (event, arg) => {
	handleTwitchAuth(event, arg, mainWindow, wss)
})

ipcMain.on('delete-selected-playlist', async (event, arg) => {
	await deletePlaylist(arg, event)
})

ipcMain.on('submit-user-data', async (event, arg) => {
	handleSubmitUserData(event, arg, mainWindow)
})

ipcMain.on('open-spotify-auth-url', async (event, arg) => {
	const spotifyRedirectUri = `http://127.0.0.1:5001/auth/spotify/callback/`
	console.log('Spotify Redirect URI: ', spotifyRedirectUri)
	handleSpotifyAuth(event, arg, mainWindow, wss, spotifyRedirectUri)
})

ipcMain.on('open-discord-auth-url', async (event, arg) => {
	const state = 'npchatbot-' + Date.now() // You can generate a random state for security
	const discordAuthUrl = getDiscordAuthUrl(state)
	shell.openExternal(discordAuthUrl)
})

ipcMain.on('validate-live-playlist', async (event, arg) => {
	const isValid = await validateLivePlaylist(arg.url)
	event.reply('validate-live-playlist-response', { isValid: isValid })
})

ipcMain.on('update-connection-state', (event, state) => {
	console.log('-----------------------')
	console.log('Connection state updated:', state)
	isConnected = state
})

ipcMain.on('share-playlist-to-discord', async (event, payload) => {
	const { spotifyURL, sessionDate } = payload || {}
	const userData = await getUserData(db)
	const twitchChannelName = userData?.twitchChannelName
	const webhookURL = userData?.discord?.webhook_url
	await sharePlaylistToDiscord(
		spotifyURL,
		webhookURL,
		twitchChannelName,
		sessionDate,
		event
	)
})

// ipc handler to return user's playlist summary data
ipcMain.on('get-playlist-summaries', async (event, arg) => {
	const playlistSummaries = await getPlaylistSummaries()
	if (playlistSummaries && playlistSummaries.length > 0) {
		console.log('Playlist summaries retrieved successfully')
		console.log('----------------------------------')
		const playlistSummaryData = await getPlaylistSummaryData(playlistSummaries)
		console.log(
			`${playlistSummaryData.commonTracks.length} common tracks found across playlists.`
		)
		console.log('----------------------------------')
		event.reply('get-playlist-summaries-response', playlistSummaries)
	} else {
		console.log('No playlist summaries found.')
		event.reply('get-playlist-summaries-response', [])
	}
})

// ipc handler for the Twitch connection process
ipcMain.on('start-bot-script', async (event, arg) => {
	const validStartResponse = await handleStartBotScript(event, arg, botProcess)
	if (validStartResponse === false) {
		return
	}
	// load configurations and initialize chatbot script
	setTimeout(() => {
		loadConfigurations()
			.then((config) => {
				setTimeout(async () => {
					const init = await initializeBot(config)
					tmiInstance = init
					botProcess === true
					event.reply('start-bot-response', {
						success: true,
						message: 'npChatbot is connected to your Twitch channel.',
					})
				}, 1000)
			})
			.catch((err) => {
				logToFile(`Error loading configurations: ${err}`)
				logToFile('*******************************')
				console.error('Error loading configurations:', err)
			})
			.finally(() => {
				console.log('------------------')
				console.log('Bot started successfully')
				console.log('------------------')
			})
	}, 1000)
})

// ipc handler for the Twitch disconnection process
ipcMain.on('stop-bot-script', async (event, arg) => {
	const playlistData = await getCurrentPlaylistSummary()
	console.log('Playlist data: ', playlistData)
	if (playlistData) {
		const finalPlaylistData = await createPlaylistSummary(playlistData)
		const user = await getUserData(db)
		if (user) {
			if (user.isSpotifyEnabled) {
				finalPlaylistData.spotify_link = user.currentSpotifyPlaylistLink
			} else {
				finalPlaylistData.spotify_link = ''
			}
		}
		await addPlaylist(finalPlaylistData)
	} else {
		console.log('No playlist data found to insert into database.')
	}

	await handleStopBotScript(event, arg, tmiInstance)
	console.log('----- STOPPING BOT SCRIPT -----')
	tmiInstance = null
	botProcess = false
	isConnected = false
	console.log('npChatbot successfully disconnected from Twitch')
	console.log('--------------------------------------')
})

// create the main application window
const createWindow = async () => {
	mainWindow = new BrowserWindow({
		width: 1130,
		height: 525,
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: 'rgb(49, 49, 49)',
			symbolColor: 'white',
		},
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, './scripts/preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
		},
		icon: path.join(__dirname, './client/public/favicon.ico'),
	})

	const appURL = isDev
		? 'http://127.0.0.1:3000'
		: `file://${path.join(__dirname, './client/build/index.html')}`

	if (isDev) {
		// wait for client dev server to be ready before loading
		const ready = await waitForServer('http://127.0.0.1:3000')
		if (!ready) {
			console.error('Client dev server did not start in time.')
			return
		}
	}

	mainWindow.loadURL(appURL)
	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	})
	// mainWindow.webContents.openDevTools();

	mainWindow.on('close', (event) => {
		if (isConnected) {
			event.preventDefault()
			const response = dialog.showMessageBoxSync(mainWindow, {
				type: 'warning',
				buttons: ['Cancel', 'Close'],
				defaultId: 0,
				title: 'Closing npChatbot...',
				message:
					'npChatbot is currently connected to your Twitch channel. Are you sure you want to close it?',
			})

			if (response === 1) {
				tmiInstance = null
				botProcess = false
				isConnected = false
				app.quit()
			}
		} else {
			// if not connected, quit immediately
			app.quit()
		}
	})
}

// use the async createWindow everywhere
app.on('activate', async () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		await createWindow()
	}
})

app.on('ready', async () => {
	startServer()
	await createWindow()
})

app.on('before-quit', () => {
	if (mainWindow) {
		mainWindow.destroy()
	}
	if (serverInstance) {
		serverInstance.close(() => {
			console.log('Server closed.')
		})
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
