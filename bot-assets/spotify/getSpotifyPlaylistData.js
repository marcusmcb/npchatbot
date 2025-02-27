const axios = require('axios')
const {
	checkSpotifyAccessToken,
} = require('../../auth/spotify/checkSpotifyAccessToken')

const getSpotifyPlaylistData = async (spotifyPlaylistId) => {
	const accessToken = await checkSpotifyAccessToken()
	if (!accessToken) {
		console.error(
			'Cannot submit playlist track search, Spotify authentication failed.'
		)
		return
	}
	try {
		const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})
		console.log('---------------------------------')
		
		for (let i = 0; i < response.data.tracks.items.length; i++) {
			console.log(response.data.tracks.items[i].track.name)
		}
		console.log('--------------------------------')
		return response.data.tracks.items.length
	} catch (error) {
		console.error('Error getting Spotify song data: ', error)
	}
}

module.exports = {
	getSpotifyPlaylistData,
}
