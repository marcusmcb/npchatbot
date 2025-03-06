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
const errorHandler = require('../helpers/errorHandler/errorHandler')
const db = require('../database/database')
const getUserData = require('../database/helpers/getUserData')
const OBSWebSocket = require('obs-websocket-js').default
const obs = new OBSWebSocket()

// refactor as stand-alone helper method


const handleStartBotScript = async (event, arg, botProcess) => {
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
}

module.exports = {
	handleStartBotScript,
}
