const axios = require('axios')

const addTracksToSpotifyPlaylist = async (
	accessToken,
	playlistId,
	trackUris
) => {	
	const batchSize = 100
	for (let i = 0; i < trackUris.length; i += batchSize) {
		const batch = trackUris.slice(i, i + batchSize)
		try {
			await axios.post(
				`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
				{
					uris: batch,
				},
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			)
			console.log(`Batch added to playlist successfully: ${batch}`)
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