const axios = require('axios')
const db = require('../../database/database')
const { getCurrentDate } = require('../spotify/helpers/spotifyPlaylistHelpers')
const logToFile = require('../../scripts/logger')

const createSpotifyPlaylist = async () => {
	try {
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({}, (err, doc) => {
				if (err) reject(err)
				else resolve(doc)
			})
		})

		if (!user || !user.spotifyAccessToken || !user.spotifyUserId) {
			logToFile('No stored access token or Spotify user ID found')
			throw new Error('No stored access token or Spotify user ID found')
		} else {
			logToFile('User data found for Spotify playlist creation')
			logToFile('-------------------------')
			console.log('User data found for Spotify playlist creation')
			console.log('-------------------------')
		}

		const accessToken = user.spotifyAccessToken
		const spotifyUserId = user.spotifyUserId
		const playlistName = `Twitch Stream Playlist - ${getCurrentDate()}`

		const data = {
			name: playlistName,
			description: `Selections from my stream over at twitch.tv/${user.twitchChannelName}`,
			public: true,
		}

		logToFile('Creating new Spotify playlist...')
		logToFile('-------------------------')
		logToFile(`Access token: ${accessToken}`)
		logToFile(`User ID: ${spotifyUserId}`)
		logToFile(`Playlist name: ${playlistName}`)


		try {
			const response = await axios.post(
				`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`,
				data,
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`,
					},
				}
			)

			console.log('New playlist created successfully!')
			console.log('-------------------------')
			// console.log(response.data)

			await new Promise((resolve, reject) => {
				db.users.update(
					{},
					{
						$set: {
							currentSpotifyPlaylistLink: response.data.external_urls.spotify,
							currentSpotifyPlaylistId: response.data.id,
						},
					},
					{ multi: false },
					(err, numReplaced) => {
						if (err) reject(err)
						else resolve(numReplaced)
					}
				)
			})
			return {
				success: true,
				message: 'New Spotify playlist created successfully.',
			}
		} catch (error) {			
			logToFile(`SPOTIFY AXIOS CALL: ${JSON.stringify(error)}`)
			logToFile('-------------------------')
			console.error('Error creating new playlist:', error.response.data)
			console.log('Spotify Playlist error - playlist creation failed')
			return {
				success: false,
				error:
					'There was an error creating your Spotify playlist. Please reauthorize npChatbot with Spotify and try again.',
			}
		}
	} catch (error) {
		logToFile('No user found for Spotify playlist creation')
		logToFile(`SPOTIFY USER LOOKUP FAILED: ${JSON.stringify(error)}`)	
		logToFile('-------------------------')
		console.error('Error creating new playlist:', error)
		console.log('Spotify Playlist error - no user found')
		return null
	}
}

module.exports = { createSpotifyPlaylist }
