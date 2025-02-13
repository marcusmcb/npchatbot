const scrapeData = require('../commands/liveReport/LiveReportHelpers/scrapeData')
const {
	cleanCurrentSongInfo,
	cleanQueryString
} = require('../spotify/helpers/spotifyPlaylistHelpers')
const { getSpotifySongData } = require('../spotify/getSpotifySongData')
const {
	addTracksToSpotifyPlaylist,
} = require('../spotify/addTracksToSpotifyPlaylist')

let currentSong = null
let trackingInterval = null

const trackCurrentSongPlaying = async (config, url, twitchClient) => {
	const channel = `#${config.twitchChannelName}`
	const isSpotifyEnabled = config.isSpotifyEnabled
	const isAutoIDEnabled = config.isAutoIDEnabled
	const isAutoIDCleanupEnabled = config.isAutoIDCleanupEnabled
	const spotifyPlaylistId = config.currentSpotifyPlaylistId
	const accessToken = config.spotifyAccessToken

	if (currentSong === null) {
		if (isSpotifyEnabled === true) {
			console.log(
				'Adding all songs from Serato Live Playlist scrape to Spotify playlist...'
			)
			console.log('--------------------')
			const response = await scrapeData(url)
			const results = response[0]
			if (!results || results.length === 0) {
				console.log('No songs found in Serato Live Playlist scrape.')
				console.log(
					'Check that your Serato Live Playlist is active and public.'
				)
				console.log('--------------------')
				return
			} else if (results.length > 0) {
				let songUris = []
				for (let i = 0; i < results.length; i++) {
					const songQuery = cleanCurrentSongInfo(
						results[i].children[0].data.trim()
					)
					const query = cleanQueryString(songQuery)
					console.log('Spotify Song Query: ', songQuery)
					const spotifySongUri = await getSpotifySongData(accessToken, query)
					songUris.push(spotifySongUri)
				}
				if (songUris.length > 0) {
					setTimeout(async () => {
						await addTracksToSpotifyPlaylist(
							accessToken,
							spotifyPlaylistId,
							songUris
						)
					}, 1000)

					// set the current song playing to the first song in the playlist
					// to prevent adding it as a duplicate to the playlist
					currentSong = results[0].children[0].data.trim()
					if (isAutoIDCleanupEnabled === true) {
						currentSong = cleanCurrentSongInfo(currentSong)
					}
				} else {
					console.log(
						'No Spotify URIs found for songs in Serato Live Playlist.'
					)
					console.log('--------------------')
				}
			}
		}
		setTimeout(() => {
			twitchClient.say(
				channel,
				'npChatbot is now tracking the current song playing.'
			)
		}, 10000)
	}

	const checkCurrentSong = async (url) => {
		try {
			const response = await scrapeData(url)
			const results = response[0]
			console.log('Current Song Playing: ')
			console.log(results[0].children[0].data.trim())
			console.log('--------------------')
			return results[0].children[0].data.trim()
		} catch (error) {
			console.log('Error checking current song playing: ', error)
		}
	}

	trackingInterval = setInterval(async () => {
		let newCurrentSong = await checkCurrentSong(url)

		if (isAutoIDCleanupEnabled === true) {
			newCurrentSong = cleanCurrentSongInfo(newCurrentSong)
		}

		console.log('Current Song Playing: ', currentSong)
		console.log('New Current Song Playing: ', newCurrentSong)

		// check if the current song playing has changed
		// and update the current song playing accordingly
		if (newCurrentSong !== currentSong) {
			currentSong = newCurrentSong

			// return the current song playing if the Auto ID feature is enabled
			if (isAutoIDEnabled === true) {
				twitchClient.say(channel, `Now playing: ${currentSong}`)
			}

			// update the user's Spotify playlist with the current song playing
			if (isSpotifyEnabled === true) {
				let uri = []
				const songQuery = cleanCurrentSongInfo(currentSong)
				const query = cleanQueryString(songQuery)
				console.log('Query: ', query)
				console.log('Spotify Song Query: ', songQuery)
				const spotifySongUri = await getSpotifySongData(accessToken, query)
				uri.push(spotifySongUri)
				if (spotifySongUri) {
					await addTracksToSpotifyPlaylist(accessToken, spotifyPlaylistId, uri)
				}
			}
		} else {
			console.log('Current song playing has not changed.')
		}
	}, 10000)
}

const endTrackCurrentSongPlaying = () => {
	if (trackingInterval) {
		clearInterval(trackingInterval)
		trackingInterval = null
		console.log('Auto ID tracking interval successfully ended.')
	}
}

module.exports = {
	trackCurrentSongPlaying,
	endTrackCurrentSongPlaying,
}
