const axios = require('axios')
const db = require('../../database') 
const dotenv = require('dotenv')

dotenv.config()

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const getSpotifyAccessToken = async () => {
	try {		
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
		
		const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
			'base64'
		)
		
		const data = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: clientId, 
			client_secret: clientSecret, 
		}).toString()

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

		// // Fetch updated user from NEDB
		// const updatedUser = await new Promise((resolve, reject) => {
		// 	db.users.findOne({}, (err, doc) => {
		// 		if (err) reject(err)
		// 		else resolve(doc)
		// 	})
		// })

		// console.log('Updated user access token stored: ')
		// console.log(updatedUser)
		// console.log('-------------------------')

		return newAccessToken
	} catch (error) {
		console.error('Error refreshing access token:', error.message)
		return null
	}
}

module.exports = { getSpotifyAccessToken }
