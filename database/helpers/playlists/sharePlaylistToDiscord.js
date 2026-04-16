const axios = require('axios')

const sharePlaylistToDiscord = async (
	spotifyURL,
	webhookURL,
	twitchChannelName,
	sessionDate,
	event
) => {
	const reply = (payload) => {
		try {
			if (event && typeof event.reply === 'function') {
				event.reply('share-playlist-to-discord-response', payload)
			}
		} catch {}
	}

	try {
		if (!spotifyURL || !webhookURL) {
			reply({ success: false })
			return false
		}

		const formattedDate = sessionDate
			? new Date(sessionDate).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
			  })
			: null
		const safeName = twitchChannelName || 'Unknown'
		const message = `Check out the Spotify playlist from ${safeName}'s ${formattedDate} stream on Twitch! - ${spotifyURL}`

		const resp = await axios.post(webhookURL, { content: message })

		if (resp.status >= 200 && resp.status < 300) {
			console.log('Message sent to Discord via webhook successfully.')
			reply({ success: true })
			return true
		}

		console.error('Webhook post failed:', resp.status, resp.data)
		reply({ success: false })
		return false
	} catch (err) {
		console.error(
			'Error posting via webhook:',
			err.response?.status,
			err.response?.data || err.message
		)
		reply({ success: false })
		return false
	}
}

module.exports = { sharePlaylistToDiscord }
