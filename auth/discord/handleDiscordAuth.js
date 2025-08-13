const fetch = require('node-fetch')
const querystring = require('querystring')

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

		const response = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			body: params,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		})
		return response.json()
	} catch (error) {
		console.error('Error exchanging Discord code for token:', error)
		console.log('-------------------------------')
	}
}

module.exports = { getDiscordAuthUrl, exchangeCodeForDiscordToken }
