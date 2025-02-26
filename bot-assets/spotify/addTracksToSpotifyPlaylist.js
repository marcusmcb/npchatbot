const axios = require('axios')
const {
	checkSpotifyAccessToken,
} = require('../../auth/spotify/checkSpotifyAccessToken')
const WebSocket = require('ws')

const addTracksToSpotifyPlaylist = async (playlistId, trackUris, wss) => {
	console.log("Track Uri's: ", trackUris.length)
	const batchSize = 100

	const accessToken = await checkSpotifyAccessToken()
	if (!accessToken) {
		console.error('Cannot add tracks, Spotify authentication failed.')
		return
	}

	for (let i = 0; i < trackUris.length; i += batchSize) {
		const batch = trackUris.slice(i, i + batchSize)
		try {
			await axios.post(
				`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
				{ uris: batch },
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			)
			console.log(`Batch added to playlist successfully: ${batch}`)
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send('Spotify playlist successfully updated.')
				}
			})
		} catch (error) {
			console.error(
				`Error adding batch to playlist:`,
				error.response?.data || error.message
			)
			return
		}
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
}

module.exports = { addTracksToSpotifyPlaylist }
