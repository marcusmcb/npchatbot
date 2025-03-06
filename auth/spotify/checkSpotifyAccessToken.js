const axios = require('axios')
const db = require('../../database/database')
const {
	getSpotifyAccessToken,
} = require('../../auth/spotify/getSpotifyAccessToken')

const checkSpotifyAccessToken = async () => {
	try {
		// Retrieve user from NEDB
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({}, (err, doc) => {
				if (err) reject(err)
				else resolve(doc)
			})
		})

		if (!user || !user.spotifyAccessToken) {
			console.error('No stored access token found.')
			return null
		}

		let accessToken = user.spotifyAccessToken

		// Test the current access token with a simple request to Spotify
		try {
			await axios.get('https://api.spotify.com/v1/me', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			})

			// If successful, return the valid access token
			console.log('Spotify access token is valid.')
			return accessToken
		} catch (error) {
			if (error.response && error.response.status === 401) {
				console.error('Spotify access token expired. Refreshing token...')

				// Refresh token
				const newAccessToken = await getSpotifyAccessToken()

				if (!newAccessToken) {
					console.error('Failed to refresh access token.')
					return null
				}

				// Update the database with the new access token
				await new Promise((resolve, reject) => {
					db.users.update(
						{},
						{ $set: { spotifyAccessToken: newAccessToken } },
						{ multi: false },
						(err, numReplaced) => {
							if (err) reject(err)
							else resolve(numReplaced)
						}
					)
				})

				console.log('Spotify access token successfully refreshed.')
				return newAccessToken // ✅ Return the new access token!
			} else {
				console.error(
					'Error verifying Spotify access token:',
					error.response?.data || error.message
				)
				return null
			}
		}
	} catch (error) {
		console.error('Error checking Spotify access token:', error.message)
		return null
	}
}

module.exports = { checkSpotifyAccessToken }
