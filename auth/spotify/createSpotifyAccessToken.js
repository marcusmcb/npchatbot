const axios = require('axios')
const db = require('../../database')
const logToFile = require('../../scripts/logger')
const WebSocket = require('ws')
const dotenv = require('dotenv')
dotenv.config()

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET
const spotifyRedirectUri = process.env.SPOTIFY_REDIRECT_URI

const exchangeCodeForSpotifyToken = async (code) => {
	logToFile(`exchangeCodeForSpotifyToken called with code: ${code}`)

	const authHeader = Buffer.from(
		`${spotifyClientId}:${spotifyClientSecret}`
	).toString('base64')

	const data = new URLSearchParams({
		code: code,
		redirect_uri: spotifyRedirectUri,
		grant_type: 'authorization_code',
	}).toString()

	try {
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

		if (response.data) {
			console.log(`Token exchange successful: ${JSON.stringify(response.data)}`)
			logToFile(`Token exchange successful: ${JSON.stringify(response.data)}`)
			logToFile(`* * * * * * *`)
			return response.data
		} else {
			console.log(`Token exchange error: ${JSON.stringify(response)}`)
			logToFile(`Token exchange error: ${JSON.stringify(response)}`)
			logToFile(`* * * * * * *`)
		}
	} catch (error) {
		console.error(
			'Error exchanging code for token:',
			error.response?.data || error.message
		)
		logToFile(
			`Error exchanging code for token: ${JSON.stringify(
				error.response?.data || error.message
			)}`
		)
		logToFile(`* * * * * * *`)
	}
}

const initSpotifyAuthToken = async (code, wss, mainWindow) => {
	try {
		const token = await exchangeCodeForSpotifyToken(code)
		if (token) {
			console.log(
				`exchangeCodeForSpotifyToken result successful: ${JSON.stringify(
					token
				)}`
			)
			logToFile(
				`exchangeCodeForSpotifyToken result successful: ${JSON.stringify(
					token
				)}`
			)
			logToFile(`* * * * * * *`)
		} else {
			console.log(
				`exchangeCodeForSpotifyToken result error: ${JSON.stringify(token)}`
			)
			logToFile(
				`exchangeCodeForSpotifyToken result error: ${JSON.stringify(token)}`
			)
			logToFile(`* * * * * * *`)
		}

		db.users.findOne({}, (err, user) => {
			if (err) {
				console.error('Error finding the user:', err)
				logToFile('Error finding the user:', err)
				logToFile(`* * * * * * *`)
				return res.status(500).send('Database error.')
			}

			if (user) {
				console.log('User found: ', user)
				logToFile(`User found: ${JSON.stringify(user)}`)
				logToFile(`* * * * * * *`)
				db.users.update(
					{ _id: user._id },
					{
						$set: {
							spotifyAccessToken: token.access_token,
							spotifyRefreshToken: token.refresh_token,
							spotifyAuthorizationCode: code,
						},
					},
					{},
					(err, numReplaced) => {
						if (err) {
							console.error('Error updating user:', err)
							logToFile('Error updating user:', err)
							logToFile(`* * * * * * *`)
							return res.status(500).send('Database error.')
						}

						if (numReplaced) {
							console.log('User updated successfully!')
							logToFile('User updated successfully!')
							logToFile(`* * * * * * *`)
						}
					}
				)
			} else {
				db.users.insert(
					{
						spotifyAccessToken: token.access_token,
						spotifyRefreshToken: token.refresh_token,
						spotifyAuthorizationCode: code,
					},
					(err, newDoc) => {
						if (err) {
							console.error('Error creating new user:', err)
							logToFile('Error creating new user:', err)
							logToFile(`* * * * * * *`)
							return res.status(500).send('Error adding auth code to user file')
						}

						if (newDoc) {
							console.log('New user created successfully!')
							logToFile('New user created successfully!')
							logToFile(`* * * * * * *`)
							mainWindow.webContents.send('auth-successful', {
								_id: newDoc._id,
								spotifyRefreshToken: newDoc.spotifyRefreshToken,
							})
						}
					}
				)
			}
		})
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send('npChatbot successfully linked to your Spotify account')
			}
		})
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`Error during Spotify auth: ${error}`)
			}
		})
		logToFile(`Error exchanging code for token: ${error}`)
		logToFile(`* * * * * * *`)
	}
}

const updateSpotifyUserToken = async (db, event, token) => {}

module.exports = {
	exchangeCodeForSpotifyToken,
	initSpotifyAuthToken,
	updateSpotifyUserToken,
}
