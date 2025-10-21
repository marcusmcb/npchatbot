const axios = require('axios')
const querystring = require('querystring')
const db = require('../../database/database')
const WebSocket = require('ws')

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI =
	process.env.DISCORD_REDIRECT_URI ||
	'http://localhost:5003/auth/discord/callback'

const getDiscordAuthUrl = (state) => {
	const params = querystring.stringify({
		client_id: DISCORD_CLIENT_ID,
		redirect_uri: DISCORD_REDIRECT_URI,
		response_type: 'code',
		scope: 'identify guilds webhook.incoming',
		state,
		prompt: 'consent',
	})
	return `https://discord.com/oauth2/authorize?${params}`
}

const exchangeCodeForDiscordToken = async (code) => {
	try {
		console.log('Discord Token Exchange called.')
		console.log('-------------------------------')
		const params = new URLSearchParams()
		params.append('client_id', DISCORD_CLIENT_ID)
		params.append('client_secret', DISCORD_CLIENT_SECRET)
		params.append('grant_type', 'authorization_code')
		params.append('code', code)
		params.append('redirect_uri', DISCORD_REDIRECT_URI)
		params.append('scope', 'identify guilds webhook.incoming')

		console.log('Token exchange params: ', params)
		console.log('-------------------------------')

		const response = await axios.post(
			'https://discord.com/api/oauth2/token',
			params.toString(),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		)
		return response.data
	} catch (error) {
			console.error('Error exchanging Discord code for token:', error)
			console.log('-------------------------------')
			return error?.response?.data || { error: error.message }
	}
}

const initDiscordAuthToken = async (code, wss, mainWindow) => {
	try {
		console.log('Exchanging Discord code for token...')
		console.log('-------------------------------')
		console.log('Auth Code: ', code)
		console.log('-------------------------------')

		// exchange auth code for token

		// set discordAccessToken, discordRefreshToken
		// and discordAuthorizationCode in users.db

		const tokenData = await exchangeCodeForDiscordToken(code)
		if (tokenData) console.log('Token Data: ', tokenData)
		console.log('-------------------------------')
		// Store Discord tokens in NeDB users database
		db.users.update(
			{},
			{
				$set: {
					discord: {
						accessToken: tokenData.access_token,
						refreshToken: tokenData.refresh_token,
						authorizationCode: code,
						webhook_url: tokenData.webhook.url,
						channel_id: tokenData.webhook.channel_id,
						guild_id: tokenData.webhook.guild_id,
						webhook_id: tokenData.webhook.id,
					},
				},
			},
			{ multi: true },
			(err) => {
				if (err) {
					console.error('Error saving Discord tokens:', err)
				} else {
					console.log('Discord tokens saved to database.')
				}
			}
		)

		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send('npChatbot successfully linked to your Discord channel')
			}
		})

		// mainWindow.webContents.send('discord-auth-success', tokenData)
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		wss.clients.forEach(function each(client) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`Error during Discord auth: ${error}`)
			}
		})
	}
}

module.exports = {
	getDiscordAuthUrl,
	exchangeCodeForDiscordToken,
	initDiscordAuthToken,
}
