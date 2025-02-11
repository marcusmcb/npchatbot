const axios = require('axios')
const { updateSpotifyPlaylist } = require('../spotify/updateSpotifyPlaylist')
const scrapeData = require('../commands/liveReport/LiveReportHelpers/scrapeData')

let currentSong = null

const trackCurrentSongPlaying = async (config, url, twitchClient) => {
	const channel = `#${config.twitchChannelName}`
	// const isSpotifyEnabled = config.isSpotifyEnabled
	// const isAutoIDEnabled = config.isAutoIDEnabled
	// const isAutoIDCleanupEnabled = config.isAutoIDCleanupEnabled

	if (currentSong === null) {
		// if (config.isSpotifyEnabled === true) {
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
			// for (let i = 0; i < results.length; i++) {
			// 	let trackId = results[i].children[0].data.trim()
			// 	console.log(trackId)
			// }
			return results[0].children[0].data.trim()
		} catch (error) {
			console.log('Error checking current song playing: ', error)
		}
	}

	setInterval(async () => {
		let newCurrentSong = await checkCurrentSong(url)
		// check if the current song playing has changed
		if (newCurrentSong !== currentSong) {
			console.log('New current song playing: ', newCurrentSong)
			currentSong = newCurrentSong
			// check if auto ID and cleanup are enabled
			// if (config.isAutoIDEnabled === true) {
			// 	if (config.isAutoIDCleanupEnabled === true) {
			// 		const currentSongCleaned = cleanCurrentSongInfo(currentSong)
			// 		twitchClient.say(channel, `Now playing: ${currentSongCleaned}`)
			// 	} else {
			// 		twitchClient.say(channel, `Now playing: ${currentSong}`)
			// 	}
			// }
			// // check if the Spotify feature is enabled
			// if (config.isSpotifyEnabled === true) {
			// 	const accessToken = config.spotifyAccessToken
			// 	const spotifyPlaylistId = config.spotifyPlaylistId
			// 	const songQuery = cleanCurrentSongInfo(currentSong)
			// 	const spotifySongUri = await getSpotifySongData(accessToken, songQuery)
			// 	await updateSpotifyPlaylist(accessToken, spotifyPlaylistId, spotifySongUri)
			// }
			twitchClient.say(channel, `Now playing: ${currentSong}`)
		} else {
			console.log('Current song playing has not changed.')
		}
	}, 20000)
}

module.exports = {
	trackCurrentSongPlaying,
}
