const axios = require('axios')
const { stringSimilarity } = require('string-similarity-js')
const {
	checkSpotifyAccessToken,
} = require('../../auth/spotify/checkSpotifyAccessToken')

const {
	cleanCurrentSongInfo,
	cleanQueryString,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

const getSpotifySongData = async (songQuery) => {
	const accessToken = await checkSpotifyAccessToken()
	if (!accessToken) {
		console.error('Cannot submit track search, Spotify authentication failed.')
		return
	}

	try {
		const url = `https://api.spotify.com/v1/search?q=${songQuery}&type=track&limit=3&market=USA`
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})
		const tracks = response.data.tracks.items
		console.log('')
		console.log('Spotify Response for: ', songQuery)
		console.log('-------------------')
		for (let i = 0; i < tracks.length; i++) {
			console.log('Result: ', i + 1)
			console.log('-------------------')
			console.log(tracks[i].name)
			console.log(tracks[i].artists[0].name)
			console.log('-------------------')
		}

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i]
			const trackString = `${track.artists[0].name} - ${track.name}`
			const trackCleaned = cleanCurrentSongInfo(trackString)
			const trackComparison = cleanQueryString(trackCleaned)

			console.log('Song Query: ', songQuery)
			console.log(`Track ${i + 1} Returned: `, trackComparison)
			console.log('-------------------')

			// Check for exact match
			if (trackComparison === songQuery) {
				return track.uri
			}

			// Check for partial match
			const similarity = stringSimilarity(songQuery, trackComparison)
			if (similarity > 0.5) {
				// Adjust the threshold as needed
				return track.uri
			}
		}

		// If no match is found, return null or handle accordingly
		console.log('No matching track found for:', songQuery)
		return null
	} catch (error) {
		// add error message to response and return it
		console.error(
			`Error getting song data for "${songQuery}":`,
			error.response?.data || error.message
		)
		return null
	}
}

module.exports = { getSpotifySongData }
