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

// db, bot config/initialization, and utility methods
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
const { handleGetUserData } = require('./database/helpers/handleGetUserData')
const {
	handleSubmitUserData,
} = require('./database/helpers/handleSubmitUserData')

// serato live playlist status validation
const {
	validateLivePlaylist,
} = require('./helpers/validations/validateLivePlaylist')

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

const isDev = true

process.env.NODE_ENV = isDev ? 'development' : 'production'

// socket config for auth responses
const wss = new WebSocket.Server({ port: 8080 })

// utility method to start app server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

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

ipcMain.on('open-spotify-auth-url', async (event, arg) => {
	const spotifyRedirectUri = `http://127.0.0.1:5001/auth/spotify/callback/`
	console.log('Spotify Redirect URI: ', spotifyRedirectUri)
	handleSpotifyAuth(event, arg, mainWindow, wss, spotifyRedirectUri)
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

ipcMain.on('update-connection-state', (event, state) => {
	console.log('-----------------------')
	console.log('Connection state updated:', state)
	isConnected = state
})

ipcMain.on('submitUserData', async (event, arg) => {
	handleSubmitUserData(event, arg, mainWindow)
})

ipcMain.on('stopBotScript', async (event, arg) => {
	handleStopBotScript(event, arg, tmiInstance)	
	tmiInstance = null
	botProcess = false
	isConnected = false
	
	// logic check to see if user has report enabled
	// if so, scrape the user's live playlist on final time
	// here and send to client for display

	console.log('npChatbot successfully disconnected from Twitch')
	console.log('--------------------------------------')
})

ipcMain.on('startBotScript', async (event, arg) => {
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
		}
	})
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
