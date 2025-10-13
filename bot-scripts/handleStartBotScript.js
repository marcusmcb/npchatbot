const {
	getTwitchRefreshToken,
	updateUserToken,
} = require('../auth/twitch/createTwitchAccessToken')
const {
	createSpotifyPlaylist,
} = require('../bot-assets/spotify/createSpotifyPlaylist')
const {
	getSpotifyPlaylistData,
} = require('../bot-assets/spotify/getSpotifyPlaylistData')
const {
	getSpotifyAccessToken,
} = require('../auth/spotify/getSpotifyAccessToken')

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
	if (arg.isSpotifyEnabled === true) {
		const currentSpotifyAccessToken = await getSpotifyAccessToken()

		if (currentSpotifyAccessToken.status === 400) {
			console.log('Spotify access token is invalid')
			const errorResponse = {
				success: false,
				error: errorHandler('Spotify token is invalid'),
			}
			// console.log('--------------------------------------')
			// console.log('Error: ', errorResponse.error)
			// console.log('--------------------------------------')
			event.reply('start-bot-response', errorResponse)
			return false
		} else {
			// if continue Last playlist is not enabled, create a new Spotify playlist
			if (!arg.continueLastPlaylist === true) {
				console.log('Creating new Spotify playlist')
				console.log('-------------------------')
				let response = await createSpotifyPlaylist()
				if (response) {
					event.reply('start-bot-response', response)
				}
			} else {
				// get the currentSpotifyPlaylistId from the user.db file
				console.log('Continuing last Spotify playlist')
				console.log('-------------------------')				
				if (
					user.currentSpotifyPlaylistId !== null ||
					user.currentSpotifyPlaylistId !== undefined
				) {
					const spotifyPlaylistData = await getSpotifyPlaylistData(
						user.currentSpotifyPlaylistId
					)
					
					// check that the currentSpotifyPlaylistId is still valid
					// if not, create a new playlist
					if (
						spotifyPlaylistData === null ||
						spotifyPlaylistData === undefined || spotifyPlaylistData === 0
					) {
						console.log(
							'Existing Spotify playlist was empty or data was not found, creating a new one...'
						)
						console.log('-------------------------')
						// send message to the client UI when this occurs
						let response = await createSpotifyPlaylist()
						if (response) {
							event.reply('start-bot-response', response)
						}
					}
				} else {
					console.log('No stored Spotify playlist found, creating a new one')
					console.log('-------------------------')
					let response = await createSpotifyPlaylist()
					if (response) {
						event.reply('start-bot-response', response)
					}
				}
			}
		}
	} else {
		console.log('Spotify is not enabled')
		console.log('-------------------------')
	}
}

module.exports = {
	handleStartBotScript,
}
