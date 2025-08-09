const fetch = require('node-fetch')
const getDiscordTokens = require('../../database/helpers/userData/getDiscordTokens')

const sendDiscordMessage = async (channelId, message) => {
	return new Promise((resolve, reject) => {
		getDiscordTokens(async (err, tokens) => {
			if (err || !tokens || !tokens.access_token) {
				return reject('No Discord access token found.')
			}
			try {
				const response = await fetch(
					`https://discord.com/api/v10/channels/${channelId}/messages`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${tokens.access_token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ content: message }),
					}
				)
				const data = await response.json()
				resolve(data)
			} catch (error) {
				reject(error)
			}
		})
	})
}

module.exports = sendDiscordMessage
