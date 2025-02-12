const axios = require('axios')
const scrapeData = require('../commands/liveReport/LiveReportHelpers/scrapeData')
const {
	cleanCurrentSongInfo,
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
		}, 10000)
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
				console.log('Spotify Song Query: ', songQuery)
				const spotifySongUri = await getSpotifySongData(accessToken, songQuery)
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
		console.log('Stopped tracking current song.')
	}
}

module.exports = {
	trackCurrentSongPlaying,
	endTrackCurrentSongPlaying,
}
