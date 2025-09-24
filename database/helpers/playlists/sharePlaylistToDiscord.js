const axios = require('axios')

const sharePlaylistToDiscord = async (
	spotifyURL,
	webhookURL,
	twitchChannelName,
	sessionDate,
	event
) => {	
	try {
		const formattedDate = sessionDate
			? new Date(sessionDate).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
			  })
			: null
		const message = `Check out the Spotify playlist from ${twitchChannelName}'s ${formattedDate} stream on Twitch! - ${spotifyURL}`

		const resp = await axios.post(webhookURL, { content: message })

		if (resp.status >= 200 && resp.status < 300) {
			console.log('Message sent to Discord via webhook successfully.')
			event.reply('share-playlist-to-discord-response', { success: true })
			return
		} else {
			console.error('Webhook post failed:', resp.status, resp.data)
			// if webhook fails, fall back to token-based post below
			event.reply('share-playlist-to-discord-response', {
				success: false,
			})
		}
	} catch (err) {
		console.error('Error posting via webhook:', err.response?.status, err.response?.data || err.message)
		event.reply('share-playlist-to-discord-response', { success: false })
	}
}

module.exports = { sharePlaylistToDiscord }
