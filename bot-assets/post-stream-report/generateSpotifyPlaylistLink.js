const dotenv = require('dotenv')
const axios = require('axios')

const { getSpotifyAccessToken } = require('../../auth/spotify/getSpotifyAccessToken')
const { cleanSongTitle, getCurrentDate } = require('../spotify/helpers/spotifyPlaylistHelpers')

dotenv.config()

const spotifyUserId = process.env.SPOTIFY_USER_ID

const getSpotifySongData = async (accessToken, songsPlayed) => {
	// clean song title strings
	const cleanedSongs = songsPlayed.map((song) => cleanSongTitle(song))
	console.log('SONGS PLAYED: ', songsPlayed)
	console.log('-------------------')	

	// remove duplicate song titles by converting to a Set and back to an array
	const uniqueCleanedSongs = [...new Set(cleanedSongs)]

	console.log('CLEANED SONGS (After Deduplication): ', uniqueCleanedSongs)
	console.log('-------------------')

	const playlistTracks = []
	const skippedTracks = []
	const trackUrisSet = new Set() // Use a Set to store unique track URIs

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	for (let song of uniqueCleanedSongs) {
		// format song title for Spotify API query: replace spaces with "+"
		const formattedQuery = song.replace(/\s+/g, '+')

		const url = `https://api.spotify.com/v1/search?q=${formattedQuery}&type=track&limit=3&market=USA`

		console.log('Formatted API URL: ', url)
		console.log('-------------------')

		try {
			const response = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			})

			console.log('Spotify Response for: ', song)
			console.log('-------------------')

			const firstTrack = response.data.tracks.items[0] // Get first track directly

			for (let i = 0; i < response.data.tracks.items.length; i++) {
				console.log('Track ', i + 1)
				console.log(response.data.tracks.items[i].name)
				console.log(response.data.tracks.items[i].artists[0].name)
				console.log('-------------------')
			}

			if (firstTrack) {
				// Normalize text to lowercase for better comparison
				const originalSearch = song.toLowerCase()
				const spotifyArtist = firstTrack.artists[0].name.toLowerCase()
				const spotifyTitleRaw = firstTrack.name.toLowerCase()

				// Remove anything inside parentheses or brackets from the title
				const spotifyTitle = spotifyTitleRaw
					.replace(/\s*[\(\[].*?[\)\]]/g, '')
					.trim()

				// Check if both the artist and title exist in the original search query
				const artistMatch = new RegExp(`\\b${spotifyArtist}\\b`, 'i').test(
					originalSearch
				)
				const titleMatch = new RegExp(`\\b${spotifyTitle}\\b`, 'i').test(
					originalSearch
				)

				if (artistMatch && titleMatch) {
					console.log(`Selection for "${song}": `)
					console.log('')
					console.log(firstTrack.name)
					console.log(firstTrack.artists[0].name)
					console.log('***************************')

					const spotifyTrackData = {
						song: song,
						spotifyArtist: firstTrack.artists[0].name,
						spotifyTitle: firstTrack.name,
						spotifyUri: firstTrack.external_urls.spotify,
						spotifyTrackId: firstTrack.id,
						uri: firstTrack.uri,
						type: firstTrack.type,
					}

					playlistTracks.push(spotifyTrackData)
					trackUrisSet.add(firstTrack.uri) // Add URI to the Set

					// console.log(`SELECTED TRACK for "${song}": `, spotifyTrackData)
					// console.log('-------------------')
				} else {
					console.log(`No direct match found for "${song}". Skipping.`)
					console.log('-------------------')
					skippedTracks.push(song)
				}
			} else {
				console.log(`No tracks found for "${song}".`)
				console.log('-------------------')
				skippedTracks.push(song)
			}

			// Delay for 100 ms before the next API call
			await delay(100)
		} catch (error) {
			console.error(
				`Error getting song data for "${song}":`,
				error.response?.data || error.message
			)
		}
	}

	// Convert Set back to an array to ensure only unique URIs are returned
	const trackUris = [...trackUrisSet]

	console.log('FINAL PLAYLIST TRACKS: ', playlistTracks.length)
	console.log('TRACK URIS ADDED: ', trackUris.length)
	console.log('SKIPPED TRACKS: ', skippedTracks.length)
	console.log('-------------------')
	console.log(skippedTracks)

	return trackUris
}

/* 
dynamically add link to user's main streaming channel in the
Spotify playlist description value below
*/


const getSpotifyUserData = (accessToken) => {
	try {
		const response = axios.get('https://api.spotify.com/v1/me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})
		console.log('Spotify User Data:', response.data)
	} catch (error) {
		console.error('Error getting Spotify user data:', error)
	}
}

const createSpotifyPlaylistLink = async () => {
	const accessToken = await getSpotifyAccessToken()
	const getSpotifyUserId = await getSpotifyUserData(accessToken)
	// const playlistId = await createNewPlaylist(accessToken, spotifyUserId)
	// return playlistId
}

const generateSpotifyPlaylistLink = async (reportData) => {
	const accessToken = await getSpotifyAccessToken()
	let songsPlayed = []
	reportData.track_log.forEach((track) => {
		songsPlayed.push(track.trackId)
	})
	const spotifySongUris = await getSpotifySongData(accessToken, songsPlayed)
	const playlistId = await createNewPlaylist(accessToken, spotifyUserId)
	await addTracksToSpotifyPlaylist(accessToken, playlistId, spotifySongUris)
}

module.exports = { generateSpotifyPlaylistLink, createSpotifyPlaylistLink }
