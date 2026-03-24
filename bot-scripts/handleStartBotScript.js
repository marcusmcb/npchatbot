const {
	getTwitchRefreshToken,
	updateUserToken,
} = require('../auth/twitch/createTwitchAccessToken')
const {
	getEnabledPlaylistProviders,
} = require('../bot-assets/playlist-providers/providerRegistry')

const logToFile = require('../scripts/logger')
const errorHandler = require('../database/helpers/errorHandler/errorHandler')
const db = require('../database/database')
const getUserData = require('../database/helpers/userData/getUserData')
const OBSWebSocket = require('obs-websocket-js').default
const obs = new OBSWebSocket()

const { getToken: getKeystoreToken } = require('../database/helpers/tokens')

const handleStartBotScript = async (event, arg, botProcess) => {
	logToFile('startBotScript CALLED')
	logToFile('*******************************')

	const user = await getUserData(db)

	let errorResponse = {
		success: false,
		error: null,
	}

	// check if bot process is already running
	if (botProcess) {
		event.reply('start-bot-response', {
			success: false,
			error: 'Bot is already running.',
		})
		return false
	}

	// const user = await new Promise((resolve, reject) => {
	// 	db.users.findOne({}, (err, doc) => {
	// 		if (err) reject(err)
	// 		else resolve(doc)
	// 	})
	// })

	try {
		// Retrieve Twitch refresh token using centralized helper (keystore-first, DB fallback)
		const { getRefreshToken } = require('../database/helpers/getRefreshToken')
		const refreshToken = await getRefreshToken('twitch', user)

		const currentAccessToken = await getTwitchRefreshToken(refreshToken)
		if (currentAccessToken.status === 400) {
			const errorResponse = {
				success: false,
				error: errorHandler(currentAccessToken.message),
			}
			event.reply('start-bot-response', errorResponse)
			return false
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
		event.reply('start-bot-response', errorResponse)
		return false
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
			event.reply('start-bot-response', errorResponse)
			return false
		}
	}

	// if Spotify is enabled, get a fresh access token
	const enabledProviders = getEnabledPlaylistProviders(arg)
	if (enabledProviders.length === 0) {
		console.log('No playlist providers are enabled')
		console.log('-------------------------')
		return
	}

	for (const provider of enabledProviders) {
		if (typeof provider.refreshAccessToken === 'function') {
			const tokenResult = await provider.refreshAccessToken()
			if (tokenResult && tokenResult.status === 400) {
				console.log(`${provider.id} access token is invalid`)
				const errorResponse = {
					success: false,
					error: errorHandler('Spotify token is invalid'),
				}
				event.reply('start-bot-response', errorResponse)
				return false
			}
		}

		const response = await provider.ensurePlaylistOnBotStart({ arg, user })
		if (response) {
			event.reply('start-bot-response', response)
		}
	}
}

module.exports = {
	handleStartBotScript,
}
