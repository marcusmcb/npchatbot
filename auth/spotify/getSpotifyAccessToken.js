const axios = require('axios')
const db = require('../../database/database')
const getUserData = require('../../database/helpers/userData/getUserData')
const { getToken, storeToken } = require('../../database/helpers/tokens')
const logToFile = require('../../scripts/logger')

const getSpotifyAccessToken = async () => {
	logToFile('Refreshing Spotify access token...')
	logToFile('-------------------------')
	try {
			const user = await getUserData(db)
			if (!user) throw new Error('No user record found')

			// Try OS keystore first (keytar). If not present, fall back to legacy DB field(s)
			let tokenBlob = null
			if (user && user._id) {
				try {
					tokenBlob = await getToken('spotify', user._id)
				} catch (e) {
					// keytar may not be available in test environment; ignore and fall back
					tokenBlob = null
				}
			}

			const refreshToken =
				(tokenBlob && tokenBlob.refresh_token) ||
				user.spotifyRefreshToken ||
				user.spotify_refresh_token ||
				user.refresh_token

			if (!refreshToken) {
				throw new Error('No stored Spotify refresh token found (keytar or DB)')
			}
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

			// Persist the new access token back into keytar if we have a user id and keytar is available
			// Persist the new access token back into keytar if available. Do NOT write access tokens into DB.
			if (user && user._id && tokenBlob) {
				try {
					await storeToken('spotify', user._id, {
						...(tokenBlob || {}),
						access_token: newAccessToken,
						refreshed_at: Date.now(),
					})
				} catch (e) {
					// ignore keytar store errors in this flow
				}
			}

			return newAccessToken
	} catch (error) {
		console.log('Spotify Token Error: ')
		const status = error?.response?.status || 500
		console.log(status)
		console.log('-------------------------')
		logToFile(`Error refreshing Spotify access token: ${JSON.stringify(error)}`)
		logToFile('-------------------------')
		console.error('Error refreshing Spotify access token:', error?.message || error)

		return { status }
	}
}

module.exports = { getSpotifyAccessToken }
