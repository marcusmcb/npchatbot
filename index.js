const tmi = require('tmi.js')
const WebSocket = require('ws')

// auth, OBS, and utility methods
const {
	returnTwitchRefreshTokenConfig,
} = require('./auth/twitch/twitchAccessTokenConfig')
const { obs, connectToOBS } = require('./obs/obsConnection')
const logToFile = require('./scripts/logger')

// command config and command methods
const autoCommandsConfig = require('./bot-assets/auto-commands/config/autoCommandsConfig')
const {
	commandList,
	urlCommandList,
} = require('./bot-assets/command-list/commandList')

// auto-id and spotify methods
const {
	trackCurrentSongPlaying,
	endTrackCurrentSongPlaying,
} = require('./bot-assets/auto-id/trackCurrentSongPlaying')

const wss = new WebSocket.Server({ port: 8081 })

const initializeBot = async (config) => {
	let userCommandHistory = {}
	let urlCommandCooldown = false
	const COOLDOWN_DURATION = 5000
	const COMMAND_REPEAT_LIMIT = 10
	const displayOBSMessage = config.isObsResponseEnabled
	const seratoDisplayName = config.seratoDisplayName.replaceAll(' ', '_')

	const url = `https://serato.com/playlists/${seratoDisplayName}/live`

	// Prefer keystore-stored Twitch access token (if migrated), otherwise fall back to DB field
	const { getToken: getKeystoreToken } = require('./database/helpers/tokens')
	let twitchAuthToken = config.twitchAccessToken
	try {
		const blob = await getKeystoreToken('twitch', config._id)
		if (blob && blob.access_token) twitchAuthToken = blob.access_token
	} catch (e) {
		console.error('Error reading twitch token from keystore:', e)
	}

	const refreshTokenConfig = returnTwitchRefreshTokenConfig(
		config,
		twitchAuthToken
	)

	logToFile(`REFRESH TOKEN CONFIG: ${JSON.stringify(refreshTokenConfig)}`)
	logToFile('*******************************')

	const twitchClient = new tmi.Client(refreshTokenConfig)

	try {
		twitchClient.connect()
	} catch (error) {
		logToFile(`TWITCH CONNECTION ERROR: ${error}`)
		logToFile('*******************************')
		console.error('TWITCH CONNECTION ERROR: ', error)
		return error
	}

	if (config.isObsResponseEnabled === true) {
		await connectToOBS(config)
	}

	autoCommandsConfig(twitchClient, obs, config)

	twitchClient.on('connected', (channel, tags, message, self) => {
		console.log('Twitch connection successful')
		console.log('---------------------------------')
		if (config.isSpotifyEnabled || config.isAutoIDEnabled === true) {
			console.log('Config: ')
			console.log('Spotify Enabled: ', config.isSpotifyEnabled)
			console.log('Auto Id Enabled: ', config.isAutoIDEnabled)
			console.log('Cleanup Enabled: ', config.isAutoIDCleanupEnabled)
			trackCurrentSongPlaying(config, url, twitchClient, wss)
		}
	})

	twitchClient.on('disconnected', () => {
		// console.log(npSongsQueried)
		// console.log(dypSearchTerms)
		console.log('---------------------------------')
		console.log('Twitch client has been disconnected')
		console.log('---------------------------------')
		endTrackCurrentSongPlaying()
	})

	twitchClient.on('message', (channel, tags, message, self) => {
		if (self || !message.startsWith('!')) {
			return
		}

		const args = message.slice(1).split(' ')
		const command = args.shift().toLowerCase()

		if (!userCommandHistory[tags.username]) {
			userCommandHistory[tags.username] = []
		}

		let history = userCommandHistory[tags.username]
		history.push(command)

		if (history.length > COMMAND_REPEAT_LIMIT) {
			history.shift()
		}

		if (command in commandList) {
			if (
				history.length >= COMMAND_REPEAT_LIMIT &&
				history.every((hist) => hist === command)
			) {
				twitchClient.say(
					channel,
					`@${tags.username}, try a different command before using that one again.`
				)
			} else {
				if (command in urlCommandList && displayOBSMessage) {
					if (urlCommandCooldown) {
						twitchClient.say(
							channel,
							`@${tags.username}, please wait for the current command on screen to clear before using that one.`
						)
						return
					}
					urlCommandCooldown = true
					commandList[command](
						channel,
						tags,
						args,
						twitchClient,
						obs,
						url,
						config
					)
					setTimeout(() => {
						urlCommandCooldown = false
					}, COOLDOWN_DURATION)
				} else {
					commandList[command](
						channel,
						tags,
						args,
						twitchClient,
						obs,
						url,
						config
					)
				}
			}
		}
	})
	return twitchClient
}

module.exports = initializeBot

// Start a background migration (non-blocking) so legacy DB tokens move to keystore on startup
try {
	const { migrateAllUsers } = require('./database/helpers/migrateTokens')
	// fire-and-forget
	migrateAllUsers().catch((e) => console.error('Migration job failed:', e))
} catch (e) {
	console.error('Migration module not available:', e)
}
