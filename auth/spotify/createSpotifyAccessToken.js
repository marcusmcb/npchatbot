/*

Per the recent Spotify API changes, the user authorization redirect will
need to use secured HTTP to receive the initial app authorization code.

Update the stored .env Spotify redirect URI to use HTTPS and test
before the next build

*/

const axios = require('axios')
const db = require('../../database')
const logToFile = require('../../scripts/logger')
const WebSocket = require('ws')

const exchangeCodeForSpotifyToken = async (code) => {
	logToFile(`exchangeCodeForSpotifyToken called with code: ${code}`)
	logToFile(`* * * * * * *`)
	logToFile(`Spotify client ID: ${process.env.SPOTIFY_CLIENT_ID}`)
	logToFile(`Spotify client secret: ${process.env.SPOTIFY_CLIENT_SECRET}`)
	logToFile(`Spotify redirect URI: ${process.env.SPOTIFY_REDIRECT_URI}`)
	logToFile(`* * * * * * *`)

	const authHeader = Buffer.from(
		`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
	).toString('base64')

	const data = new URLSearchParams({
		code: code,
		redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
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
