const dotenv = require('dotenv')
const axios = require('axios')

dotenv.config()

const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const spotifyUserId = process.env.SPOTIFY_USER_ID

const getCurrentDate = () => {
	const date = new Date()
	const options = { weekday: 'long', month: 'long', day: 'numeric' }

	// format the date using Intl.DateTimeFormat
	let formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)

	// add the appropriate suffix to the day (e.g., "st", "nd", "rd", "th")
	const day = date.getDate()
	const suffix =
		day % 10 === 1 && day !== 11
			? 'st'
			: day % 10 === 2 && day !== 12
			? 'nd'
			: day % 10 === 3 && day !== 13
			? 'rd'
			: 'th'

	// replace the numeric day in the formatted string with the day + suffix
	formattedDate = formattedDate.replace(/\d+/, `${day}${suffix}`)
	return formattedDate
}

const cleanSongTitle = (title) => {
	return title.replace(/\s*[\(\[].*?[\)\]]/g, '').trim()
}

const getAccessToken = async () => {
	try {
		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			null,
			{
				params: {
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
					client_id: clientId,
					client_secret: clientSecret,
				},
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		)
		console.log('TOKEN RESPONSE: ', response.data.access_token)
		return response.data.access_token
	} catch (error) {
		console.error('Error refreshing access token:', error.response.data)
	}
}

const getSpotifySongData = async (accessToken, songsPlayed) => {
	const cleanedSongs = songsPlayed.map((song) => cleanSongTitle(song))
	console.log('SONGS PLAYED: ', songsPlayed)
	console.log('-------------------')
	console.log('CLEANED SONGS: ')
	console.log('-------------------')	
	const playlistTracks = []
	const trackUris = []

	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	for (let song of cleanedSongs) {
		try {			
			const response = await axios.get(
				`https://api.spotify.com/v1/search?q=${encodeURIComponent(
					song
				)}&type=track&limit=10&market=USA`,
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
				}
			)

			// current logic selects the track for the Spotify playlist
			// with the highest popularity value

			// reset logic to use the first track returned in the
			// API response and compare results versus using
			// the current popularity logic

			// find the track with the highest Spotify popularity value
			let mostPopularTrack = null
			let highestPopularity = -1

			for (let track of response.data.tracks.items) {
				if (track.popularity > highestPopularity) {
					mostPopularTrack = track
					highestPopularity = track.popularity
				}
			}

			if (mostPopularTrack) {		
				// console.log(`Spotify Result for "${song}": `)
				// console.log('')
				// console.log(mostPopularTrack.name)
				// console.log("***************************")		
				const mostPopularSpotifyResult = {
					song: song,
					spotifyArtist: mostPopularTrack.artists[0].name,
					spotifyTitle: mostPopularTrack.name,
					spotifyUri: mostPopularTrack.external_urls.spotify,
					spotifyTrackId: mostPopularTrack.id,
					uri: mostPopularTrack.uri,
					type: mostPopularTrack.type,
				}
				playlistTracks.push(mostPopularSpotifyResult)
				trackUris.push(mostPopularTrack.uri)
				console.log(
					`MOST POPULAR TRACK for "${song}": `,
					mostPopularSpotifyResult
				)
				// console.log(`Song Added: ${song}`)
				console.log('-------------------')
			} else {
				console.log(`No tracks found for "${song}".`)
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

	console.log('FINAL PLAYLIST TRACKS: ', playlistTracks)
	// return playlistTracks
	return trackUris
}

/* 
dynamically add link to user's main streaming channel in the
Spotify playlist description value below
*/

const createNewPlaylist = async (accessToken, spotifyUserId) => {
	const playlistName = `Twitch Stream Playlist - ${getCurrentDate()} `
	try {
		const response = await axios.post(
			`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`,
			{
				name: playlistName,
				description: 'Selections from my Twitch stream',
				public: true,
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		)
		if (response.data.id) {
			console.log('New playlist created successfully!')
		}
		return response.data.id
	} catch (error) {
		console.error('Error creating new playlist:', error)
	}
}

const addTracksToSpotifyPlaylist = async (
	accessToken,
	playlistId,
	trackUris
) => {
	console.log('-------------------')
	console.log('PLAYLIST ID: ', playlistId)
	console.log('TRACK URIS: ', trackUris)
	console.log('-------------------')	
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

const generateSpotifyPlaylistLink = async (reportData) => {
	const accessToken = await getAccessToken()
	let songsPlayed = []
	reportData.track_log.forEach((track) => {
		songsPlayed.push(track.trackId)
	})
	const spotifySongUris = await getSpotifySongData(accessToken, songsPlayed)
	const playlistId = await createNewPlaylist(accessToken, spotifyUserId)
	await addTracksToSpotifyPlaylist(accessToken, playlistId, spotifySongUris)
}

module.exports = generateSpotifyPlaylistLink
