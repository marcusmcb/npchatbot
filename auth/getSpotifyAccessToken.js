const axios = require('axios')
const db = require('../database') // Ensure correct path to your NEDB database module
const dotenv = require('dotenv')

dotenv.config()

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const getSpotifyAccessToken = async () => {
	try {
		// Retrieve user object from NEDB
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({}, (err, doc) => {
				if (err) reject(err)
				else resolve(doc)
			})
		})

		if (!user || !user.spotifyRefreshToken) {
			throw new Error('No stored refresh token found')
		} else {
			console.log('User found:')
			console.log(user)
			console.log('-------------------------')
		}

		const refreshToken = user.spotifyRefreshToken
		console.log('Using refresh token:', refreshToken)

		// Encode client credentials
		const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
			'base64'
		)

		// Prepare request payload
		const data = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: clientId, // Not strictly necessary when using Basic Auth
			client_secret: clientSecret, // Not strictly necessary when using Basic Auth
		}).toString()

		// Make the token request to Spotify
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

		// Extract the new access token
		const newAccessToken = response.data.access_token
		console.log('New Spotify access token:', newAccessToken)

		// Update the new access token in NEDB
		await new Promise((resolve, reject) => {
			db.users.update(
				{}, // Update any user (assuming only one user document)
				{ $set: { spotifyAccessToken: newAccessToken } },
				{ multi: false },
				(err, numReplaced) => {
					if (err) reject(err)
					else resolve(numReplaced)
				}
			)
		})

		// Fetch updated user from NEDB
		const updatedUser = await new Promise((resolve, reject) => {
			db.users.findOne({}, (err, doc) => {
				if (err) reject(err)
				else resolve(doc)
			})
		})

		console.log('Updated user access token stored: ')
		console.log(updatedUser)
		console.log('-------------------------')

		return newAccessToken
	} catch (error) {
		console.error('Error refreshing access token:', error.message)
		return null
	}
}

module.exports = { getSpotifyAccessToken }
