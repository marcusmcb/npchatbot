const axios = require('axios')
const db = require('../../database/database')
const getUserData = require('../../database/helpers/userData/getUserData')
const logToFile = require('../../scripts/logger')

const getSpotifyAccessToken = async () => {
	logToFile('Refreshing Spotify access token...')
	logToFile('-------------------------')
	try {
		const user = await getUserData(db)
		if (!user || !user.spotifyRefreshToken) {
			throw new Error('No stored Spotify refresh token found')
		} else {
			logToFile(`SPOTIFY TOKEN UPDATE - User found: ${JSON.stringify(user)}`)
			logToFile('-------------------------')
		}

		const refreshToken = user.spotifyRefreshToken
		const authHeader = Buffer.from(
			`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
		).toString('base64')

		const data = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: process.env.SPOTIFY_CLIENT_ID,
			client_secret: process.env.SPOTIFY_CLIENT_SECRET,
		}).toString()

		logToFile('Sending request to Spotify for new access token...')
		logToFile(`${JSON.stringify(data)}`)
		logToFile('-------------------------')

		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			data,
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					Authorization: `Basic ${authHeader}`,
				},
			}
		)

		const newAccessToken = response.data.access_token

		logToFile('New Spotify access token:')
		logToFile('-------------------------')
		logToFile(newAccessToken)
		logToFile('-------------------------')
		console.log('New Spotify access token:', newAccessToken)
		console.log('-------------------------')

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

		return newAccessToken
	} catch (error) {
		console.log('Spotify Token Error: ')
		console.log(error.response.status)
		console.log('-------------------------')
		logToFile(`Error refreshing Spotify access token: ${JSON.stringify(error)}`)
		logToFile('-------------------------')
		console.error('Error refreshing Spotify access token:', error.message)

		return {
			status: error.response.status,
		}
	}
}

module.exports = { getSpotifyAccessToken }
