const axios = require('axios')
const db = require('../../database')
const { getCurrentDate } = require('../spotify/helpers/spotifyPlaylistHelpers')

const createSpotifyPlaylist = async () => {
	try {
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({}, (err, doc) => {
				if (err) reject(err)
				else resolve(doc)
			})
		})

		if (!user || !user.spotifyAccessToken || !user.spotifyUserId) {
			throw new Error('No stored access token or Spotify user ID found')
		} else {
			console.log('User data found for Spotify playlist creation')
			console.log('-------------------------')
		}

		const accessToken = user.spotifyAccessToken
		const spotifyUserId = user.spotifyUserId
		const playlistName = `Twitch Stream Playlist - ${getCurrentDate()}`

		const data = {
			name: playlistName,
			description: 'Selections from my Twitch stream',
			public: true,
		}

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
		} catch (error) {
			console.error('Error creating new playlist:', error.response.data)
			return null
		}
		console.log('-------------------------')
	} catch (error) {
		console.error('Error creating new playlist:', error)
		return null
	}
}

module.exports = { createSpotifyPlaylist }
