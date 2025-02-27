const fs = require('fs')
const path = require('path')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')
const OBSWebSocket = require('obs-websocket-js').default
const dotenv = require('dotenv')
const WebSocket = require('ws')
const { URL } = require('url')

const express = require('express')
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const logToFile = require('./scripts/logger')
const loadConfigurations = require('./config')
const initializeBot = require('./index')

const {
	createSpotifyPlaylist,
} = require('./bot-assets/spotify/createSpotifyPlaylist')

const {
	getRefreshToken,
	updateUserToken,
	initAuthToken,
} = require('./auth/twitch/createAccessToken')

const {
	initSpotifyAuthToken,
} = require('./auth/spotify/createSpotifyAccessToken')
const {
	getSpotifyAccessToken,
} = require('./auth/spotify/getSpotifyAccessToken')
const { setSpotifyUserId } = require('./auth/spotify/setSpotifyUserId')

const {
	seratoURLValidityCheck,
	twitchURLValidityCheck,
} = require('./helpers/validations/validations')

const {
	validateLivePlaylist,
} = require('./helpers/validations/validateLivePlaylist')

const {
	updateUserData,
} = require('./helpers/updateUserParams/updateUserParams')

const { generateRandomState } = require('./auth/helpers/generateRandomState')

const errorHandler = require('./helpers/errorHandler/errorHandler')

const {
	INVALID_TWITCH_CHATBOT_URL,
	INVALID_TWITCH_URL,
	INVALID_SERATO_DISPLAY_NAME,
} = require('./bot-assets/constants/constants')

if (require('electron-squirrel-startup')) app.quit()

const options = {
	key: fs.readFileSync(path.join(__dirname, './server.key')),
	cert: fs.readFileSync(path.join(__dirname, './server.cert')),
}

const envPath = path.join(__dirname, '.env')
dotenv.config({ path: envPath })

let mainWindow
let tmiInstance
let serverInstance
let authWindow
let spotifyAuthWindow
let authCode
let authError
let spotifyAuthCode
let spotifyAuthError
let botProcess = false

const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

const isDev = true

process.env.NODE_ENV = isDev ? 'development' : 'production'

const db = require('./database')
// const { get } = require('http')
const obs = new OBSWebSocket()
const wss = new WebSocket.Server({ port: 8080 })

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

// future workflow and handlers for Spotify app authorization process
ipcMain.on('open-spotify-auth-url', async (event, arg) => {
	const spotifyClientId = process.env.SPOTIFY_CLIENT_ID
	const spotifyRedirectUri = process.env.SPOTIFY_REDIRECT_URI
	const scope = 'playlist-modify-public playlist-modify-private'
	const state = generateRandomState()
	const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyClientId}&scope=${scope}&state=${state}&redirect_uri=${spotifyRedirectUri}`

	console.log('SPOTIFY AUTH URL: ')
	console.log(spotifyAuthUrl)
	console.log('--------------------------------------')

	spotifyAuthWindow = new BrowserWindow({
		width: 800,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	spotifyAuthWindow.loadURL(spotifyAuthUrl)

	spotifyAuthWindow.webContents.on('will-navigate', async (event, url) => {
		spotifyAuthError = false
		console.log('URL:', url)
		const urlObj = new URL(url)
		const code = urlObj.searchParams.get('code')
		const error = urlObj.searchParams.get('error')
		const state = urlObj.searchParams.get('state')
		if (code) {
			console.log('CODE: ', code)
			if (state) {
				console.log('STATE: ', state)
			} else {
				console.log('NO STATE PARAMETER RETURNED')
			}
			spotifyAuthCode = code
			spotifyAuthWindow.close()
		} else if (error) {
			console.log('ERROR: ', error)
			spotifyAuthError = true
			spotifyAuthWindow.close()
		}
	})

	spotifyAuthWindow.on('closed', async () => {
		mainWindow.webContents.send('auth-code', {
			auth_code_on_close: spotifyAuthCode,
		})
		console.log('AUTHCODE ON CLOSE: ', spotifyAuthCode)
		if (spotifyAuthError) {
			console.log('NO AUTH CODE RETURNED: ', spotifyAuthError)
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send('npChatbot authorization with Spotify was cancelled.')
				}
			})
			spotifyAuthWindow = null
		} else if (spotifyAuthCode !== undefined) {
			console.log('AUTH CODE: ', spotifyAuthCode)
			await initSpotifyAuthToken(spotifyAuthCode, wss, mainWindow)
			setTimeout(async () => {
				await setSpotifyUserId()
			}, 100)
			spotifyAuthWindow = null
		}
	})
})

// ipc handler for opening the Twitch auth window and response
ipcMain.on('open-twitch-auth-url', async (event, arg) => {
	const clientId = process.env.TWITCH_CLIENT_ID
	const redirectUri = process.env.TWITCH_AUTH_REDIRECT_URL

	// update this to use the randomized state generator method used in the Spotify auth handler

	const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671`

	// set authWindow height to user's screen height

	authWindow = new BrowserWindow({
		width: 800,
		height: 800,
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
			initAuthToken(authCode, wss, mainWindow)
			authWindow = null
		}
	})
})

// ipc method to fetch user data on app load
ipcMain.on('getUserData', async (event, arg) => {
	if (fs.existsSync(db.users.filename)) {
		try {
			const user = await new Promise((resolve, reject) => {
				db.users.findOne({}, (err, user) => {
					if (err) {
						reject(err)
					} else {
						resolve(user)
					}
				})
			})

			if (user) {
				const responseObject = {
					success: true,
					data: user,
				}
				event.reply('getUserDataResponse', responseObject)
			} else {
				event.reply('getUserDataResponse', {
					success: false,
					error: 'No user found',
				})
			}
		} catch (error) {
			console.error('Error fetching user data:', error)
			event.reply('getUserDataResponse', {
				success: false,
				error: 'Error fetching user data',
			})
		}
	} else {
		event.reply('getUserDataResponse', {
			success: false,
			error: 'users.db was not found',
		})
	}
})

// method to start HTTPS server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

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

	// if Spotify is enabled, get a fresh access token and
	// create a new Spotify playlist or continue the most
	// recent one
	if (arg.isSpotifyEnabled === true) {		
		await getSpotifyAccessToken()
		if (!arg.continueLastPlaylist === true) {
			console.log("*******************************")
			console.log("Creating new Spotify playlist")
			console.log("*******************************")
			let response = await createSpotifyPlaylist()
			if (response) {
				event.reply('startBotResponse', response)
			}
		} else {
			console.log("***-----------------------------***")
			console.log("Continuing last Spotify playlist")
			console.log("***-----------------------------***")
		}		
	} else {
		console.log('Spotify is not enabled')
	}

	try {
		// get a fresh access token and update the user.db file
		const currentAccessToken = await getRefreshToken(arg.twitchRefreshToken)
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

// ipc method to validate Serato Playlist is live
ipcMain.on('validateLivePlaylist', async (event, arg) => {
	const isValid = await validateLivePlaylist(arg.url)
	event.reply('validateLivePlaylistResponse', { isValid: isValid })
})

// ipc method to notify client when user data is udpated
ipcMain.on('userDataUpdated', () => {
	mainWindow.webContents.send('userDataUpdated')
})

// ipc method to handler user data/preference updates
ipcMain.on('submitUserData', async (event, arg) => {
	let token
	try {
		const currentAccessToken = await getRefreshToken(arg.twitchRefreshToken)
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

ipcMain.on('open-auth-settings', (event, url) => {
	shell.openExternal(url)
})

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

app.on('ready', () => {
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
