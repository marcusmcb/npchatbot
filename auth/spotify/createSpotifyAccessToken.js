/*

Per the recent Spotify API changes, the user authorization redirect will
need to use secured HTTP to receive the initial app authorization code.

Update the stored .env Spotify redirect URI to use HTTPS and test
before the next build

*/

const axios = require('axios')
const db = require('../../database/database')
const logToFile = require('../../scripts/logger')
const WebSocket = require('ws')
const { storeToken } = require('../../database/helpers/tokens')

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

			// Wrap the DB operations in promises so we can await them and ensure tests observe the changes
			const findOneAsync = () =>
				new Promise((resolve, reject) => db.users.findOne({}, (err, user) => (err ? reject(err) : resolve(user))))
			const insertAsync = (doc) =>
				new Promise((resolve, reject) => db.users.insert(doc, (err, newDoc) => (err ? reject(err) : resolve(newDoc))))
			const updateAsync = (q, u) =>
				new Promise((resolve, reject) => db.users.update(q, u, {}, (err, num) => (err ? reject(err) : resolve(num))))

			const user = await findOneAsync()

			if (user) {
				try {
					// Persist tokens into OS keystore via keytar
					await storeToken('spotify', user._id, {
						access_token: token.access_token,
						refresh_token: token.refresh_token,
						authorization_code: code,
						expires_in: token.expires_in,
					})
					// Mark authorized in DB so UI can avoid repeated keychain reads
					await updateAsync({ _id: user._id }, { $set: { isSpotifyAuthorized: true } })
					// Do NOT persist raw tokens in the DB anymore; keystore is the single source of truth
					console.log('User updated successfully! (tokens stored in keytar)')
					logToFile('User updated successfully! (tokens stored in keytar)')
				} catch (e) {
					const msg = e && e.message ? e.message : String(e)
					console.error('Error storing tokens in keytar:', msg)
					logToFile(`Error storing tokens in keytar: ${msg}`)
				}
			} else {
				try {
					// create user without persisting sensitive tokens in the DB
					const newDoc = await insertAsync({})
					await storeToken('spotify', newDoc._id, {
						access_token: token.access_token,
						refresh_token: token.refresh_token,
						authorization_code: code,
						expires_in: token.expires_in,
					})
					await updateAsync({ _id: newDoc._id }, { $set: { isSpotifyAuthorized: true } })
					console.log('New user created and tokens stored in keytar')
					logToFile('New user created and tokens stored in keytar')
					// notify renderer that auth succeeded, but do NOT include tokens or sensitive fields
					mainWindow.webContents.send('auth-successful', { _id: newDoc._id })
				} catch (e) {
					const msg = e && e.message ? e.message : String(e)
					console.error('Error creating new user or storing new user tokens in keytar:', msg)
					logToFile(`Error creating new user or storing new user tokens in keytar: ${msg}`)
				}
			}
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

module.exports = {
	exchangeCodeForSpotifyToken,
	initSpotifyAuthToken,
}
