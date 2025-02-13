const tmi = require('tmi.js')
const autoCommandsConfig = require('./bot-assets/auto-commands/config/autoCommandsConfig')
const {
	commandList,
	urlCommandList,
} = require('./bot-assets/command-list/commandList')
const { obs, connectToOBS } = require('./obs/obsConnection')
const { returnRefreshTokenConfig } = require('./auth/twitch/accessTokenConfig')
const logToFile = require('./scripts/logger')
const {
	npSongsQueried,
	dypSearchTerms,
} = require('./bot-assets/command-use/commandUse')
const {
	trackCurrentSongPlaying, endTrackCurrentSongPlaying
} = require('./bot-assets/auto-id/trackCurrentSongPlaying')

const initializeBot = async (config) => {
	let userCommandHistory = {}
	let urlCommandCooldown = false
	const COOLDOWN_DURATION = 5000
	const COMMAND_REPEAT_LIMIT = 10
	const displayOBSMessage = config.isObsResponseEnabled
	const seratoDisplayName = config.seratoDisplayName.replaceAll(' ', '_')

	const url = `https://serato.com/playlists/${seratoDisplayName}/live`

	const refreshTokenConfig = returnRefreshTokenConfig(
		config,
		config.twitchAccessToken
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
			console.log("Spotify Enabled: ", config.isSpotifyEnabled)
			console.log("Auto Id Enabled: ", config.isAutoIDEnabled)
			console.log("Cleanup Enabled: ", config.isAutoIDCleanupEnabled)
			trackCurrentSongPlaying(config, url, twitchClient)
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
