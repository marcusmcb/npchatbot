const fetch = (...args) =>
	import('node-fetch').then((mod) => mod.default(...args))

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

		const resp = await fetch(webhookURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: message }),
		})

		if (resp.ok) {
			console.log('Message sent to Discord via webhook successfully.')
			event.reply('share-playlist-to-discord-response', { success: true })
			return
		} else {
			const errText = await resp.text()
			console.error('Webhook post failed:', resp.status, errText)
			// if webhook fails, fall back to token-based post below
			event.reply('share-playlist-to-discord-response', {
				success: false,
			})
		}
	} catch (err) {
		console.error('Error posting via webhook:', err)
	}
}

module.exports = { sharePlaylistToDiscord }
