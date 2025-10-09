const {
	getTwitchRefreshToken,
	updateUserToken,
} = require('../../../auth/twitch/createTwitchAccessToken')
const {
	updateUserData,
} = require('../updateUserParams/updateUserParams')
const {
	seratoURLValidityCheck,
	twitchURLValidityCheck,
} = require('../validations/validations')
const {
	INVALID_TWITCH_CHATBOT_URL,
	INVALID_TWITCH_URL,
	INVALID_SERATO_DISPLAY_NAME,
} = require('../../../bot-assets/constants/constants')

const logToFile = require('../../../scripts/logger')
const errorHandler = require('../errorHandler/errorHandler')
const db = require('../../database')
const { getToken } = require('../tokens')

const handleSubmitUserData = async (event, arg, mainWindow) => {
	let token
	try {
		// Prefer the refresh token stored in the OS keystore (keytar).
		// Fall back to the client-provided arg.twitchRefreshToken only if keystore is empty.
		const user = await new Promise((resolve, reject) =>
			db.users.findOne({}, (err, doc) => (err ? reject(err) : resolve(doc)))
		)
		if (!user) {
			const errorResponse = {
				success: false,
				error: 'No user found for token lookup',
			}
			event.reply('userDataResponse', errorResponse)
			return
		}

		let refreshTokenFromKeystore = null
		try {
			// try immediate read
			let blob = await getToken('twitch', user._id)
			refreshTokenFromKeystore = blob && blob.refresh_token
			// If keystore write may still be in-flight (auth insert path writes keystore async),
			// poll briefly for the token to appear before falling back to client arg.
			if (!refreshTokenFromKeystore) {
				const timeoutMs = 800
				const intervalMs = 100
				const maxTries = Math.ceil(timeoutMs / intervalMs)
				for (let i = 0; i < maxTries && !refreshTokenFromKeystore; i++) {
					await new Promise((r) => setTimeout(r, intervalMs))
					try {
						blob = await getToken('twitch', user._id)
						refreshTokenFromKeystore = blob && blob.refresh_token
					} catch (e) {
						// ignore transient keytar errors and keep polling
					}
				}
			}
		} catch (e) {
			// keytar may not be available in some environments (tests); ignore and fall back
			refreshTokenFromKeystore = null
		}

		const refreshToken = refreshTokenFromKeystore || arg.twitchRefreshToken
		if (!refreshToken) {
			const errorResponse = {
				success: false,
				error: errorHandler('No stored Twitch refresh token found'),
			}
			event.reply('userDataResponse', errorResponse)
			return
		}

		const currentAccessToken = await getTwitchRefreshToken(refreshToken)
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

	// validate the user's Serato and Twitch channel names before submitting the update
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
}

module.exports = {
	handleSubmitUserData,
}
