const fs = require('fs')
const path = require('path')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const WebSocket = require('ws')
const express = require('express')
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { createMainWindow } = require('./scripts/createMainWindow')
const { waitForServer } = require('./scripts/waitForServer')

// bot config/initialization, and utility methods
const db = require('./database/database')
const loadConfigurations = require('./config')
const initializeBot = require('./index')
const { handleStartBotScript } = require('./bot-scripts/handleStartBotScript')
const { handleStopBotScript } = require('./bot-scripts/handleStopBotScript')
const logToFile = require('./scripts/logger')

// auth handlers and user data methods
const { handleTwitchAuth } = require('./auth/twitch/handleTwitchAuth')
const { handleSpotifyAuth } = require('./auth/spotify/handleSpotifyAuth')
const { getDiscordAuthUrl } = require('./auth/discord/handleDiscordAuth')
const {
	startSpotifyCallbackServer,
} = require('./auth/spotify/spotifyCallbackServer')
const {
	startDiscordCallbackServer,
} = require('./auth/discord/discordCallbackServer')
const {
	handleGetUserData,
} = require('./database/helpers/userData/handleGetUserData')
const {
	handleSubmitUserData,
} = require('./database/helpers/userData/handleSubmitUserData')

// serato live playlist status validation
const {
	validateLivePlaylist,
} = require('./database/helpers/validations/validateLivePlaylist')

// user data handler
const getUserData = require('./database/helpers/userData/getUserData')
const { getToken } = require('./database/helpers/tokens')

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
const {
	repairPlaylistSummaries,
} = require('./database/helpers/playlistSummaries/repairPlaylistSummaries')
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
const SPOTIFY_HTTP_PORT = 5001
const DISCORD_HTTP_PORT = 5003
server.use(bodyParser.json())
server.use(cors())

const isDev = !app.isPackaged
process.env.NODE_ENV = isDev ? 'development' : 'production'
// Enable a conservative Keychain fallback on macOS packaged builds
if (process.platform === 'darwin' && app.isPackaged) {
	process.env.KEYCHAIN_ACCOUNT_FALLBACK = 'true'
}

// socket config for auth responses
const wss = new WebSocket.Server({ port: 8080 })

// utility method to start app server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

// start Discord auth callback server
let discordCallbackServer = null

try {
	discordCallbackServer = startDiscordCallbackServer({
		port: DISCORD_HTTP_PORT,
		wss,
		getMainWindow: () => mainWindow,
	})
} catch (e) {
	console.error('Failed to start Discord callback server:', e)
}

// start Spotify auth callback server
let spotifyCallbackServer = null

try {
	spotifyCallbackServer = startSpotifyCallbackServer({
		port: SPOTIFY_HTTP_PORT,
		wss,
		getMainWindow: () => mainWindow,
	})
} catch (e) {
	console.error('Failed to start Spotify callback server:', e)
}

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

ipcMain.on('open-auth-settings', (event, url) => {
	shell.openExternal(url)
})

// Accept logs forwarded from renderer process (preload.logToMain)
ipcMain.on('renderer-log', (_event, message) => {
	try {
		const pretty =
			typeof message === 'object'
				? JSON.stringify(message, null, 2)
				: String(message)
		// Write to file and also to console
		logToFile(`[renderer] ${pretty}`)
		// console.log('[renderer]', pretty)
	} catch (e) {
		console.error('Failed to write renderer log to file', e)
	}
})

ipcMain.on('get-user-data', async (event, arg) => {
	const response = await handleGetUserData()
	event.reply('getUserDataResponse', response)
})

ipcMain.handle('get-user-data', async (_event, _arg) => {
	const response = await handleGetUserData()
	return response
})

ipcMain.on('userDataUpdated', () => {
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('open-spotify-link', (event, spotifyUrl) => {
	shell.openExternal(spotifyUrl)
})

ipcMain.on('open-twitch-auth-url', async (event, arg) => {
	handleTwitchAuth(event, arg, mainWindow, wss)
})

ipcMain.on('delete-selected-playlist', async (event, arg) => {
	await deletePlaylist(arg, event)
})

ipcMain.on('get-playlist-summaries', async (event, _arg) => {
	try {
		const summaries = await getPlaylistSummaries()
		event.reply(
			'get-playlist-summaries-response',
			Array.isArray(summaries) ? summaries : []
		)
	} catch (e) {
		console.error('Failed to fetch playlist summaries:', e)
		event.reply('get-playlist-summaries-response', null)
	}
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
	const state = 'npchatbot-' + Date.now()
	const discordAuthUrl = getDiscordAuthUrl(state)
	shell.openExternal(discordAuthUrl)
})

ipcMain.on('validate-live-playlist', async (event, arg) => {
	const isValid = await validateLivePlaylist(arg.url)
	event.reply('validate-live-playlist-response', { isValid: isValid })
})

ipcMain.on('update-connection-state', (event, state) => {
	isConnected = state
})

ipcMain.on('share-playlist-to-discord', async (event, payload) => {
	const { spotifyURL, sessionDate } = payload || {}
	const userData = await getUserData(db)
	const twitchChannelName = userData?.twitchChannelName
	// use webhook URL from keytar token blob if available, otherwise fall back to legacy DB field
	let webhookURL = null
	try {
		if (userData && userData._id) {
			const discordBlob = await getToken('discord', userData._id)
			webhookURL = discordBlob?.webhook?.url || null
		}
	} catch (e) {
		// keytar may not be available in some environments; fall back to DB
		webhookURL = null
	}
	if (!webhookURL) webhookURL = userData?.discord?.webhook_url || null
	await sharePlaylistToDiscord(
		spotifyURL,
		webhookURL,
		twitchChannelName,
		sessionDate,
		event
	)
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

// create the main application window via helper
const initMainWindow = async () => {
	const preloadPath = path.join(__dirname, './scripts/preload.js')
	const iconPath = path.join(__dirname, './client/public/favicon.ico')
	const appHtmlFilePath = path.join(__dirname, './client/build/index.html')

	mainWindow = await createMainWindow({
		isDev,
		getIsConnected: () => isConnected,
		onForceClose: () => {
			tmiInstance = null
			botProcess = false
			isConnected = false
			app.quit()
		},
		preloadPath,
		iconPath,
		waitForServer,
		devServerUrl: 'http://127.0.0.1:3000',
		appHtmlFilePath,
	})
}

// use the async createWindow everywhere
app.on('activate', async () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		await initMainWindow()
	}
})

app.on('ready', async () => {
	startServer()
	// run migration before creating the main window so tokens are migrated on app startup.
	// controlled by env var MIGRATE_ON_STARTUP (default: enabled). Set to 'false' to skip.
	const migrateFlag = process.env.MIGRATE_ON_STARTUP
	if (migrateFlag === undefined || migrateFlag.toLowerCase() !== 'false') {
		try {
			const { migrateAllUsers } = require('./database/helpers/migrateTokens')
			// run migration in the background so it cannot block UI startup. We log completion when it finishes.
			try {
				// default to removing legacy fields on startup migration; set MIGRATE_REMOVE_LEGACY=false to keep legacy values
				const removeLegacy =
					(process.env.MIGRATE_REMOVE_LEGACY || 'true').toLowerCase() === 'true'
				migrateAllUsers({ compact: true, removeLegacy })
					.then((summary) => {
						if (summary) {
							console.log('Startup token migration completed. Summary:')
							console.log(`  usersScanned: ${summary.usersScanned}`)
							console.log(
								`  migrated: spotify=${summary.migrated.spotify}, discord=${summary.migrated.discord}, twitch=${summary.migrated.twitch}`
							)
							if (summary.errors && summary.errors.length > 0) {
								console.error('  migration errors:')
								console.error(JSON.stringify(summary.errors, null, 2))
							} else {
								console.log('  no migration errors')
							}
						} else {
							console.log('Startup token migration completed with no summary.')
						}
					})
					.catch((e) => console.error('Startup migration failed:', e))
			} catch (e) {
				console.error('Startup migration invocation failed:', e)
			}
		} catch (e) {
			console.error(
				'Migration module not available during startup migration:',
				e
			)
		}
	} else {
		console.log(
			'MIGRATE_ON_STARTUP is set to false, skipping startup migration.'
		)
	}
	await initMainWindow()
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
	if (discordCallbackServer) {
		try {
			discordCallbackServer.close(() => {
				console.log('Discord callback server closed.')
			})
		} catch (e) {
			console.error('Error closing Discord callback server:', e)
		}
	}
	if (spotifyCallbackServer) {
		try {
			spotifyCallbackServer.close(() => {
				console.log('Spotify callback server closed.')
			})
		} catch (e) {
			console.error('Error closing Spotify callback server:', e)
		}
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
