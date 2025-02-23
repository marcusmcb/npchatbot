const axios = require('axios')
const {
	checkSpotifyAccessToken,
} = require('../../auth/spotify/checkSpotifyAccessToken')

const addTracksToSpotifyPlaylist = async (playlistId, trackUris) => {
	console.log("Track Uri's: ", trackUris.length)
	const batchSize = 100

	// 🔹 Step 1: Ensure the Spotify access token is valid before proceeding
	const accessToken = await checkSpotifyAccessToken()
	if (!accessToken) {
		console.error('Cannot add tracks, Spotify authentication failed.')
		return
	}

	console.log('Updated Access Token: ', accessToken)
	console.log('Playlist ID: ', playlistId)

	// 🔹 Step 2: Process tracks in batches of 100
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
