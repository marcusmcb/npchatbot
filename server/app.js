const express = require('express')
const { spawn } = require('child_process')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const Datastore = require('nedb')
const fs = require('fs')

const db = {}

const PORT = process.env.PORT || 5000
const app = express()
const scriptPath = path.join(__dirname, '../boot.js')

app.use(bodyParser.json())
app.use(cors())

db.users = new Datastore({ filename: 'users.db', autoload: true })
db.preferences = new Datastore({ filename: 'preferences.db', autoload: true })

app.get('/', (req, res) => {
	res.send('Hello world, I am here YO!')
})

app.get('/getUserData', (req, res) => {
	if (fs.existsSync('users.db')) {
		console.log('users.db exists! Fetching the user information...')

		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error fetching the user:', err)
			} else if (user) {
				console.log('User information:', user)
				res.send(user)
			} else {
				console.log('users.db does not exist yet')
				res.status(404).send({ error: 'No user found.' })
			}
		})
	} else {
		console.log('users.db does not exist yet.')
	}
})

app.post('/submitUserData', async (req, res) => {
	console.log('REQUEST BODY: ')
	console.log(req.body)

	const user = {
		twitchChannelName: req.body.twitchChannelName,
		twitchChatbotName: req.body.twitchChatbotName,
		twitchOAuthKey: req.body.twitchOAuthKey,
		seratoDisplayName: req.body.seratoDisplayName,
		obsWebsocketAddress: req.body.obsWebsocketAddress,
		obsWebsocketPassword: req.body.obsWebsocketPassword,
		intervalMessageDuration: req.body.intervalMessageDuration,
		obsClearDisplayTime: req.body.obsClearDisplayTime,
		userEmailAddress: req.body.userEmailAddress,
		isObsResponseEnabled: req.body.isObsResponseEnabled,
		isIntervalEnabled: req.body.isIntervalEnabled,
		isReportEnabled: req.body.isReportEnabled,
	}

	db.users.remove({}, { multi: true }, (err, numRemoved) => {
		if (err) return res.status(500).send({ error: 'DB error during deletion' })
		db.users.insert(user, (err, newUser) => {
			if (err)
				return res.status(500).send({ error: 'DB error during creation' })
			console.log(newUser)
			res.json(newUser)
		})
	})
})

let botProcess

app.post('/startBotScript', (req, res) => {
	if (botProcess) {
		return res.send('npChatbot has already been started')
	}
	botProcess = spawn('node', [scriptPath])

	botProcess.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`)
		// add handler/listener for chatroom join confirmation
		if (data.includes('info: Joined #djmarcusmcb')) {
			res.send('--- npChatbot has joined the chat ---')
		}
	})

	botProcess.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`)
	})

	botProcess.on('close', (code) => {
		console.log(`botProcess process exited with code ${code}`)
	})

	// res.send('Script started successfully')
})

app.post('/stopBotScript', (req, res) => {
	if (botProcess) {
		botProcess.kill();  // Kill the child process
		res.send('Bot process killed successfully.');
	} else {
		res.send('No bot process running.');
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`)
})

//	CLIENT/SERVER LOAD SEQ (FUTURE DEV/API)
//
//	check for user credentials
//		1) API call to /userCredentials
//
//	if users.db:
//		1) load values from users.db
//			a) update API method to only store current values
//		2) API call to /userPreferences
//			if preferences.db:
//				1) load values from preferences.db
//			else:
//				1) load defaults (each feature off)
//
//	else if !users.db:
//		1) set form inputs to placeholder values
//
//		2) submit/enable buttons disabled until base values entered
//			a) twitch channel name
//			b) twitch chatbot name
//			c) twitch OAuth key
//			d) serato display name
//
//		3) preferences enabled on successful validation of base credentials
//			a) post-stream report:
//				1) if enabled, email address is required
//					a) display error info if field is blank when updated and enabled
//					b) validate proper email string is entered otherwise
//						1) display error info if email string is invalid
//			b) interval messages:
//				1) default value: 15 minutes
//				2) interval range: 5-30 minutes
//
//		4) preferences enabled on successful validation of base/OBS credentials:
//			a) OBS clear time:
//				i) default value: 5 seconds (5000ms)
//				ii) display range: 2 seconds - 20 seconds
//
//		5) Chatbot Controls:
//			a) connect:
//				1) API call to /startBot
//				2) confirm twitch client connection
//				3) confirm OBS client connection (if enabled)
//
//			b) disconnect:
//				1) API call to /stopBot
//				2) confirm twitch & OBS disconnections
//
//			c) session info panel:
//				1) display connection status in client UI
//				2) display bot's current uptime
//				3) other stats/info TBD (total commands used, etc)
//
