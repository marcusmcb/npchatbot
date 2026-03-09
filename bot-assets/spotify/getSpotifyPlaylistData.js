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
		// Feb 2026: playlist track management endpoints renamed from /tracks to /items.
		// This endpoint also reliably returns `total` without requiring the full playlist object.
		const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/items?limit=1&offset=0`
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})

		if (typeof response.data?.total === 'number') return response.data.total
		if (Array.isArray(response.data?.items)) return response.data.items.length
		return 0
	} catch (error) {
		// Fallback for older API responses / non-owned playlists.
		try {
			const url = `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}`
			const response = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			})

			if (typeof response.data?.items?.total === 'number') return response.data.items.total
			if (Array.isArray(response.data?.items?.items)) return response.data.items.items.length
			if (typeof response.data?.tracks?.total === 'number') return response.data.tracks.total
			if (Array.isArray(response.data?.tracks?.items)) return response.data.tracks.items.length
			return 0
		} catch (fallbackError) {
			console.error(
				'Error getting Spotify playlist data:',
				fallbackError.response?.data || fallbackError.message
			)
			return null
		}
	}
}

module.exports = {
	getSpotifyPlaylistData,
}
