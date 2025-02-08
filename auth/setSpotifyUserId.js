const db = require('../database')
const axios = require('axios')

const setSpotifyUserId = async () => {
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
		console.log(user)
		console.log('-------------------------')
	}

	const accessToken = user.spotifyAccessToken

	try {
		const response = await axios.get('https://api.spotify.com/v1/me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})
    console.log('Spotify User Data:', response.data)
	} catch (error) {
		console.error('Error getting Spotify user data:', error)
	}
}

module.exports = { setSpotifyUserId }
