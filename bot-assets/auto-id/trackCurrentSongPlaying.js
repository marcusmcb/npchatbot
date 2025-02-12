const axios = require('axios')
const { updateSpotifyPlaylist } = require('../spotify/updateSpotifyPlaylist')
const scrapeData = require('../commands/liveReport/LiveReportHelpers/scrapeData')
const {
	cleanCurrentSongInfo,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

let currentSong = null
let trackingInterval = null

const trackCurrentSongPlaying = async (config, url, twitchClient) => {
	const channel = `#${config.twitchChannelName}`
	const isSpotifyEnabled = config.isSpotifyEnabled
	const isAutoIDEnabled = config.isAutoIDEnabled
	const isAutoIDCleanupEnabled = config.isAutoIDCleanupEnabled

	if (currentSong === null) {
		// if (isSpotifyEnabled === true) {
		// 	const spotifyPlaylistLength = await getSpotifyPlaylistLength(
		// 		config.spotifyAccessToken,
		// 		config.currentSpotifyPlaylistId
		// 	)
		// 	if (spotifyPlaylistLength === 0) {
		// 		// add all songs from Serato Live Playlist scrape to Spotify playlist
		// 	} else {
		// 		// compare spotifyPlaylistLength to Serato Live Playlist
		// 		// scrape's length to ensure Spotify playlist is updated
		// 		// accurately even if npChatbot is interrupted

		// 		// example:
		// 		// spotify playlist length is 10
		// 		// serato playlist length is 12
		// 		// query Spotify for each song in the difference and add
		// 		// them to the Spotify playlist
		// 	}
		// }
		setTimeout(() => {
			twitchClient.say(
				channel,
				'npChatbot is now tracking the current song playing.'
			)
		}, 1000)
		// add init addTracksToSpotify logic here

		// return the scrapeData results from Serato and
		// add each song found on init to the Spotify playlist
		// then run the checkCurrentSong logic thereafter

		// if a user starts their Serato Live Playlist later
		// than the Twitch stream start, the songs played will
		// still be available in the Serato Live Playlist for
		// use in the Spotify playlist
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
		let spotifySongQuery = null
		let newCurrentSong = await checkCurrentSong(url)

		if (isAutoIDCleanupEnabled === true) {
			newCurrentSong = cleanCurrentSongInfo(newCurrentSong)
		}

		if (isSpotifyEnabled === true) {
			spotifySongQuery === cleanCurrentSongInfo(newCurrentSong)
		}

		console.log('Current Song Playing: ', currentSong)
		console.log('New Current Song Playing: ', newCurrentSong)

		// check if the current song playing has changed
		// and update the current song playing accordingly
		if (newCurrentSong !== currentSong) {
			currentSong = newCurrentSong			

			// return the current song playing if the Auto ID feature is enabled
			if (isAutoIDEnabled === true) {
				if (isAutoIDCleanupEnabled === true) {
					twitchClient.say(channel, `Now playing: ${currentSong}`)
				}
			}

			// update the user's Spotify playlist with the current song playing
			if (isSpotifyEnabled === true) {
				const accessToken = config.spotifyAccessToken
				const spotifyPlaylistId = config.spotifyPlaylistId
				const songQuery = cleanCurrentSongInfo(currentSong)
				const spotifySongUri = await getSpotifySongData(accessToken, songQuery)
				await updateSpotifyPlaylist(accessToken, spotifyPlaylistId, spotifySongUri)
			}
			
		} else {
			console.log('Current song playing has not changed.')
		}
	}, 20000)
}

const endTrackCurrentSongPlaying = () => {
	if (trackingInterval) {
		clearInterval(trackingInterval)
		trackingInterval = null
		console.log('Stopped tracking current song.')
	}
}

module.exports = {
	trackCurrentSongPlaying,
	endTrackCurrentSongPlaying,
}
