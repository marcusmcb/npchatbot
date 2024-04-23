const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const { app, protocol, shell, BrowserWindow, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const scriptPath = path.join(__dirname, './boot.js')
const OBSWebSocket = require('obs-websocket-js').default
const dotenv = require('dotenv')
const WebSocket = require('ws')

dotenv.config()

require('electron-reload')(__dirname, {
	electron: require(`${__dirname}/node_modules/electron`),
})

const {
	exchangeCodeForToken,
	getRefreshToken,
	updateUserToken,
} = require('./auth/createAccessToken')
const { returnRefreshTokenConfig } = require('./auth/accessTokenConfig')

const {
	seratoURLValidityCheck,
	twitchURLValidityCheck,
} = require('./helpers/validations/validations')
const {
	updateUserData,
} = require('./helpers/updateUserParams/updateUserParams')
const errorHandler = require('./helpers/errorHandler/errorHandler')

const server = express()
const PORT = process.env.PORT || 5000
server.use(bodyParser.json())
server.use(cors())

const db = require('./database')

let mainWindow
let botProcess
let serverInstance

const obs = new OBSWebSocket()

// socket connection for successful twitch auth
// message to the client UI
const wss = new WebSocket.Server({ port: 8080 })

// const isDev = true

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

server.get('/auth/twitch/callback', async (req, res) => {
	const { code, state } = req.query

	if (code) {
		// add initial setup logic to check for user.db file
		// if present, update it with code from Twitch response
		// else, create it and add as appAuthorizationCode

		try {
			const token = await exchangeCodeForToken(code)
			console.log("*******************")
			console.log('Token:', token)
			console.log("*******************")
			// Update user data in the database
			db.users.findOne({}, (err, user) => {
				if (err) {
					console.error('Error finding the user:', err)
					return res.status(500).send('Database error.')
				}

				if (user) {
					// Update the existing user
					db.users.update(
						{ _id: user._id },
						{
							$set: {
								twitchAccessToken: token.access_token,
								twitchRefreshToken: token.refresh_token,
								appAuthorizationCode: code,
							},
						},

						{},
						(err, numReplaced) => {
							if (err) {
								console.error('Error updating the user:', err)
								return res.status(500).send('Database error during update.')
							}
							console.log(
								`Updated ${numReplaced} user(s) with new Twitch token.`
							)
						}
					)
				} else {
					db.users.insert(
						{
							twitchAccessToken: token.access_token,
							twitchRefreshToken: token.refresh_token,
							appAuthorizationCode: code,
						},
						(err, newDoc) => {
							if (err) {
								console.error('Error creating new user: ', err)
								return res
									.status(500)
									.send('Error adding auth code to user file')
							}
							console.log('User Auth Data Updated: ', newDoc)
						}
					)
				}
			})
			res.redirect('npchatbot-app://auth/success')
			wss.clients.forEach(function each(client) {
				if (client.readyState === WebSocket.OPEN) {
					client.send('npChatbot successfully linked to your Twitch account')
				}
			})
		} catch (error) {
			console.error('Error exchanging code for token:', error)
			res.status(500).send('Error during authorization.')
		}
	} else {
		res.status(400).send('No code received from Twitch.')
	}
})

ipcMain.on('getUserData', (event, arg) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the user information...')
		let preloadPath = path.join(__dirname, './scripts/preload.js')
		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error fetching the user:', err)
			} else if (user) {
				console.log('--------------------')
				console.log('Fetched User Data: ')
				console.log(user)
				console.log('--------------------')

				event.reply('getUserDataResponse', {
					success: true,
					data: user,
				})
			} else {
				console.log('users.db does not exist yet')
				// res.status(404).send({ error: 'No user found.' })
				event.reply('getUserDataResponse', {
					success: false,
					error: 'no user found',
				})
			}
		})
	} else {
		console.log('users.db was not found.')
	}
})

// Start React client app (dev only)
const startClient = () => {
	if (isDev) {
		console.log('**********************')
		console.log('->')
		console.log('Starting client app...')
		console.log('->')
		console.log('**********************')
		spawn('npm', ['start'], {
			cwd: path.join(__dirname, './client'),
			stdio: 'ignore',
			shell: true,
			detached: true,
			windowsHide: true,
		})
	}
}

// Start Express server
const startServer = () => {
	serverInstance = server.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`)
	})
}

ipcMain.on('open-auth-url', () => {
	shell.openExternal(
		'https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=19evlkrdxmriyliiey2fhhhxd8kkl6&redirect_uri=http://localhost:5000/auth/twitch/callback&scope=chat:read+chat:edit&state=c3ab8aa609ea11e793ae92361f002671'
	)
})

// IPC listener for starting the bot script
ipcMain.on('startBotScript', async (event, arg) => {
	console.log('ARGS: ', arg)
	let errorResponse = {
		success: false,
		error: null,
	}
	// validate local OBS connection if OBS responses are enabled
	if (arg.isObsResponseEnabled === true) {
		try {
			await obs.connect(
				'ws://' + arg.obsWebsocketAddress,
				arg.obsWebsocketPassword
			)
			console.log('Connected to OBS properly')
			await obs.disconnect()
			console.log('OBS validatiion passed')
			// add logic to remove obs object is properly returned
		} catch (error) {
			// format and return OBS connection error response to client app
			errorResponse.error = errorHandler(error)
			event.reply('startBotResponse', errorResponse)
			return
		}
	}

	if (botProcess) {
		console.log('Bot is already running.')
		event.reply('startBotResponse', {
			success: false,
			error: 'Bot is already running.',
		})
		return
	}

	const currentAccessToken = await getRefreshToken(arg.twitchRefreshToken)

	console.log('CAT: ', currentAccessToken)

	if (currentAccessToken.status === 400) {
		errorResponse.error = errorHandler(currentAccessToken.message)
		console.log('Error Response Obj: ', errorResponse)
		event.reply('startBotResponse', errorResponse)
		return
	} else {
		try {
			await updateUserToken(currentAccessToken)
		} catch (error) {
			console.error('Failed to update user token: ', error)
			return
		}
	}

	botProcess = spawn('node', [scriptPath])

	botProcess.stdout.on('data', (data) => {
		const parsedMessage = data.toString().trim()
		console.log(`--- stdout: DATA ---`)
		console.log(parsedMessage)
		if (
			parsedMessage
				.toLowerCase()
				.includes(`joined #${arg.twitchChannelName.toLowerCase()}`)
		) {
			console.log('--- Twitch Chat Properly Connected ---')
			const botResponse = {
				success: true,
				message: parsedMessage,
			}
			event.reply('startBotResponse', botResponse)
		} else if (parsedMessage.toLowerCase().includes('error')) {
			console.log('--- bot response error ---')
			const botResponse = {
				success: false,
				error: parsedMessage,
			}
			event.reply('startBotResponse', botResponse)
			botProcess = null
		}
	})

	botProcess.stderr.on('data', (data) => {
		if (data.includes('OBSWebSocketError')) {
			console.log('OBS ERROR')
			const botResponse = {
				success: false,
				message:
					'npChatbot could not detect OBS. Please ensure OBS is running.',
			}
			event.reply('botProcessResponse', botResponse)
		}
		console.error(`stderr: IPC --> ${data}`)
	})

	// botProcess.on('close', (code) => {
	// 	console.log(`botProcess process exited with code ${code}`)
	// 	botProcess = null
	// 	// Optionally, notify the renderer process here
	// })
})

ipcMain.on('stopBotScript', async (event, arg) => {
	if (botProcess) {
		botProcess.on('exit', () => {
			console.log('botProcess has exited.')
			botProcess = null
		})

		botProcess.kill()
		event.reply('stopBotResponse', {
			success: true,
			message: 'ipcMain: bot process successfully exited',
		})
	} else {
		event.reply('stopBotResponse', {
			success: false,
			error: 'ipcMain: no bot process running to exit',
		})
	}
})

ipcMain.on('submitUserData', async (event, arg) => {
	// add helper method to check submitted args against
	// stored user preferences
	// if different, run the necessary validations on only
	// the changed fields
	console.log('------------------')
	console.log("")
	console.log('Received Form Data: ')
	console.log(arg)
	console.log("")
	console.log('------------------')

	const isValidSeratoURL = await seratoURLValidityCheck(arg.seratoDisplayName)
	const isValidTwitchURL = await twitchURLValidityCheck(arg.twitchChannelName)

	console.log('----------------')
	console.log('Valid Serato URL?: ', isValidSeratoURL)
	console.log('Valid Twitch URL?: '), isValidTwitchURL
	console.log('----------------')

	if (isValidTwitchURL && isValidSeratoURL) {
		try {
			const data = await updateUserData(db, event, arg)
			console.log('--- DATA ---', data)
			event.reply('userDataResponse', data)
		} catch (error) {
			console.error(error)
			event.reply('userDataResponse', error)
		}
	} else {
		// Handle invalid URLs
		const errorMessage = isValidTwitchURL
			? 'The Serato profile name given is invalid'
			: 'The Twitch profile name given is invalid'
		event.reply('userDataResponse', { error: errorMessage })
	}
})

// Create the Electron BrowserWindow
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 680,
		webPreferences: {
			preload: path.join(__dirname, './scripts/preload.js'),
			nodeIntegration: false,
			contextIsolation: true, // Set to true in production
		},
	})

	const appURL = isDev
		? 'http://127.0.0.1:3000'
		: `file://${path.join(__dirname, './client/build/index.html')}`
	console.log('Loading URL: ', appURL)
	mainWindow.loadURL(appURL)
	mainWindow.webContents.openDevTools()
}

// Electron app event handlers
app.on('ready', () => {
	protocol.registerHttpProtocol('npchatbot-app', (request, callback) => {
		const url = request.url
		mainWindow.webContents.send('auth-successful', url)
	})
	startServer()
	if (isDev) {
		// startClient()
		console.log("dev mode")
	}	
	// setTimeout(() => {
	// 	console.log("creating window...")
	// 	createWindow()
	// }, 1000)
	createWindow()
	console.log('app loaded...')
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
	console.log('closing app...')
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow()
	}
})
