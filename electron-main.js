const fs = require('fs')
const path = require('path')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')
const OBSWebSocket = require('obs-websocket-js').default
const dotenv = require('dotenv')
const WebSocket = require('ws')
const express = require('express')
const { app, BrowserWindow, ipcMain, shell } = require('electron')

// db, bot config/initialization, and utility methods
const db = require('./database/database')
const loadConfigurations = require('./config')
const initializeBot = require('./index')
const logToFile = require('./scripts/logger')
const errorHandler = require('./helpers/errorHandler/errorHandler')

// auth handlers and user data methods
const { handleSpotifyAuth } = require('./auth/spotify/handleSpotifyAuth')
const { handleTwitchAuth } = require('./auth/twitch/handleTwitchAuth')
const { handleGetUserData } = require('./database/helpers/handleGetUserData')
const {
	updateUserData,
} = require('./helpers/updateUserParams/updateUserParams')

// spotify playlist methods
const {
	createSpotifyPlaylist,
} = require('./bot-assets/spotify/createSpotifyPlaylist')
const {
	getSpotifyPlaylistData,
} = require('./bot-assets/spotify/getSpotifyPlaylistData')

// auth token methods
const {
	getTwitchRefreshToken,
	updateUserToken,
} = require('./auth/twitch/createTwitchAccessToken')
const {
	getSpotifyAccessToken,
} = require('./auth/spotify/getSpotifyAccessToken')

// playlist and user screen name validation methods
const {
	seratoURLValidityCheck,
	twitchURLValidityCheck,
} = require('./helpers/validations/validations')
const {
	validateLivePlaylist,
} = require('./helpers/validations/validateLivePlaylist')

// error text constants
const {
	INVALID_TWITCH_CHATBOT_URL,
	INVALID_TWITCH_URL,
	INVALID_SERATO_DISPLAY_NAME,
} = require('./bot-assets/constants/constants')

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

// server config and middleware
const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

const isDev = true

process.env.NODE_ENV = isDev ? 'development' : 'production'

// socket config for OBS and auth responses
const obs = new OBSWebSocket()
const wss = new WebSocket.Server({ port: 8080 })

// utility method to start app server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

// refactor as stand-alone helper method
const getUserData = async (db) => {
	const user = await new Promise((resolve, reject) => {
		db.users.findOne({}, (err, doc) => {
			if (err) reject(err)
			else resolve(doc)
		})
	})

	if (!user) {
		console.error('No stored user data found.')
		return null
	} else {
		return user
	}
}

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

ipcMain.on('open-auth-settings', (event, url) => {
	shell.openExternal(url)
})

ipcMain.on('open-spotify-auth-url', async (event, arg) => {
	handleSpotifyAuth(event, arg, mainWindow, wss)
})

ipcMain.on('open-twitch-auth-url', async (event, arg) => {
	handleTwitchAuth(event, arg, mainWindow, wss)
})

ipcMain.on('getUserData', async (event, arg) => {
	handleGetUserData(event, arg)
})

ipcMain.on('userDataUpdated', () => {
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('validateLivePlaylist', async (event, arg) => {
	const isValid = await validateLivePlaylist(arg.url)
	event.reply('validateLivePlaylistResponse', { isValid: isValid })
})

// ipc method to connect the npChatbot script to Twitch
ipcMain.on('startBotScript', async (event, arg) => {
	logToFile('startBotScript CALLED')
	logToFile('*******************************')

	let errorResponse = {
		success: false,
		error: null,
	}

	// check if bot process is already running
	if (botProcess) {
		event.reply('startBotResponse', {
			success: false,
			error: 'Bot is already running.',
		})
		return
	}

	// validate local OBS connection if OBS responses are enabled
	if (arg.isObsResponseEnabled === true) {
		try {
			await obs.connect(
				'ws://' + arg.obsWebsocketAddress,
				arg.obsWebsocketPassword
			)
			await obs.disconnect()
			console.log('OBS websocket test successful')
			console.log('--------------------------------------')
		} catch (error) {
			errorResponse.error = errorHandler(error)
			event.reply('startBotResponse', errorResponse)
			return
		}
	}

	// if Spotify is enabled, get a fresh access token
	if (arg.isSpotifyEnabled === true) {
		await getSpotifyAccessToken()
		// if Continue Last Playlist is not enabled, create a new Spotify playlist
		if (!arg.continueLastPlaylist === true) {
			console.log('Creating new Spotify playlist')
			console.log('-------------------------')
			let response = await createSpotifyPlaylist()
			if (response) {
				event.reply('startBotResponse', response)
			}
		} else {
			// get the currentSpotifyPlaylistId from the user.db file
			console.log('Continuing last Spotify playlist')
			console.log('-------------------------')

			const user = await getUserData(db)
			if (
				user.currentSpotifyPlaylistId !== null ||
				user.currentSpotifyPlaylistId !== undefined
			) {
				const spotifyPlaylistData = await getSpotifyPlaylistData(
					user.currentSpotifyPlaylistId
				)
				// check that the currentSpotifyPlaylistId is still valid
				// if not, create a new playlist
				if (spotifyPlaylistData === null || spotifyPlaylistData === undefined) {
					console.log(
						'Existing Spotify playlist data not found, creating a new one...'
					)
					console.log('-------------------------')
					// send message to the client UI when this occurs
					let response = await createSpotifyPlaylist()
					if (response) {
						event.reply('startBotResponse', response)
					}
				}
			} else {
				console.log('No stored Spotify playlist found, creating a new one')
				console.log('-------------------------')
				let response = await createSpotifyPlaylist()
				if (response) {
					event.reply('startBotResponse', response)
				}
			}
		}
	} else {
		console.log('Spotify is not enabled')
	}

	try {
		// get a fresh access token and update the user.db file
		const currentAccessToken = await getTwitchRefreshToken(
			arg.twitchRefreshToken
		)
		if (currentAccessToken.status === 400) {
			const errorResponse = {
				success: false,
				error: errorHandler(currentAccessToken.message),
			}
			event.reply('startBotResponse', errorResponse)
			return
		} else {
			await updateUserToken(db, event, currentAccessToken)
			console.log('User token successfully updated')
			console.log('--------------------------------------')
			logToFile('User token successfully updated')
			logToFile('*******************************')
		}
	} catch (error) {
		const errorResponse = {
			success: false,
			error: 'Failed to update user token.',
		}
		event.reply('startBotResponse', errorResponse)
		return
	}

	// refactor the following sequence to properly await the user
	// token update before the loadConfigurations method is called

	// setTimeout as a stop-gap solution solves the problem but the
	// configuration should not be called until the users.db file
	// update with the new token returned has completed

	// helper method or refactor existing code to properly await
	// the user.db file update

	// optionally, move the entire loadConfigurations sequence into
	// the try/catch block above

	// *** UPDATE: test the above scenario ***

	// load configurations and initialize chatbot script
	setTimeout(() => {
		loadConfigurations()
			.then((config) => {
				setTimeout(async () => {
					const init = await initializeBot(config)
					tmiInstance = init
					botProcess === true
					event.reply('startBotResponse', {
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

// ipc method to disconnect npChatbot script from Twitch
ipcMain.on('stopBotScript', async (event, arg) => {
	/*
	
	add logic to scrape data from "live" playlist page with backup logic to
	scrape the data from the first playlist in the user's Serato playlists page
	if the live playlist session has ended
	
	*/

	if (tmiInstance) {
		await tmiInstance.disconnect().then((data) => {
			console.log('TWITCH CHAT HAS BEEN DISCONNECTED')
			console.log('- - - - - - - - - - - - - - - - - -')
		})
		tmiInstance = null
		botProcess = false
		console.log('npChatbot successfully disconnected from Twitch')
		console.log('--------------------------------------')

		// add logic to save playlist stats and search/query data
		// to NEDB instance when bot script is disconnected from Twitch

		event.reply('stopBotResponse', {
			success: true,
			message: 'ipcMain: bot client successfully disconnected',
			// data: finalReportData,
		})
	} else {
		event.reply('stopBotResponse', {
			success: false,
			error: 'ipcMain: no bot client running to disconnect',
		})
	}
})

// ipc method to handler user data/preference updates
ipcMain.on('submitUserData', async (event, arg) => {
	let token
	try {
		const currentAccessToken = await getTwitchRefreshToken(
			arg.twitchRefreshToken
		)
		if (currentAccessToken.status === 400) {
			const errorResponse = {
				success: false,
				error: errorHandler(currentAccessToken.message),
			}
			event.reply('userDataResponse', errorResponse)
			return
		} else {
			await updateUserToken(db, event, currentAccessToken)
			console.log('User token successfully updated')
			console.log('--------------------------------------')
			logToFile('User token successfully updated')
			logToFile('*******************************')
		}
		token = currentAccessToken
	} catch (error) {
		const errorResponse = {
			success: false,
			error: 'Failed to refresh user token during update.',
		}
		event.reply('userDataResponse', errorResponse)
		return
	}

	// validate the user's Serato and Twitch channel names
	// before submitting the update
	const seratoDisplayName = arg.seratoDisplayName.replaceAll(' ', '_')
	const isValidSeratoURL = await seratoURLValidityCheck(seratoDisplayName)
	const isValidTwitchURL = await twitchURLValidityCheck(
		arg.twitchChannelName,
		token
	)
	const isValidTwitchChatbotURL = await twitchURLValidityCheck(
		arg.twitchChatbotName,
		token
	)

	if (isValidTwitchURL && isValidTwitchChatbotURL && isValidSeratoURL) {
		try {
			const data = await updateUserData(db, event, arg)
			mainWindow.webContents.send('userDataUpdated')
			event.reply('userDataResponse', data)
		} catch (error) {
			console.error('User data update error: ', error)
			event.reply('userDataResponse', error)
		}
	} else if (!isValidTwitchURL) {
		event.reply('userDataResponse', { error: INVALID_TWITCH_URL })
	} else if (!isValidTwitchChatbotURL) {
		event.reply('userDataResponse', { error: INVALID_TWITCH_CHATBOT_URL })
	} else {
		event.reply('userDataResponse', { error: INVALID_SERATO_DISPLAY_NAME })
	}
})

// ipc method to handle npChatbot disconnection from Twitch
// add method to clear users.db file if user opts to fully
// remove the app from their Twitch configuration

// add logic to handle the case where a user opts to
// fully close the running npChatbot app while it's
// still connected to Twitch

const createWindow = () => {
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
	mainWindow.loadURL(appURL)
	// mainWindow.webContents.openDevTools()
}

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})

app.on('ready', async () => {
	startServer()
	createWindow()
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
