const db = require('../../database')
const axios = require('axios')

const setSpotifyUserId = async () => {
	try {
		// fetch user object from database
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({}, (err, doc) => {
				if (err) reject(err)
				else resolve(doc)
			})
		})

		if (!user || !user.spotifyAccessToken) {
			throw new Error('No stored Spotify user ID found')
		} else {
			console.log('User found:')			
			console.log('-------------------------')
		}

		// parse the access token needed to return user's data
		const accessToken = user.spotifyAccessToken

		try {
			const response = await axios.get('https://api.spotify.com/v1/me', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			})

			console.log('Spotify User Data:', response.data)

			await new Promise((resolve, reject) => {
				db.users.update(
					{},
					{ $set: { spotifyUserId: response.data.id } },
					{ multi: false },
					(err, numReplaced) => {
						if (err) reject(err)
						else resolve(numReplaced)
					}
				)
			})
      console.log('Spotify User ID updated successfully')
		} catch (error) {
			// add error message to response and return it
			console.error('Error getting Spotify user data:', error)
		}
	} catch (error) {
		// add error message to response and return it
		console.error('Error updating credentials with Spotify User ID:', error)
	}
}

module.exports = { setSpotifyUserId }
