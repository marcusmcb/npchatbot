const axios = require('axios')
const { updateSpotifyPlaylist } = require('../spotify/updateSpotifyPlaylist')
const scrapeData = require('../commands/liveReport/LiveReportHelpers/scrapeData')

let currentSong = null

const trackCurrentSongPlaying = async (config, url, twitchClient) => {
	const channel = `#${config.twitchChannelName}`

	if (currentSong === null) {
		setTimeout(() => {
			twitchClient.say(
				channel,
				'npChatbot is now tracking the current song playing.'
			)
		}, 1000
  )
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
		if (newCurrentSong !== currentSong) {
			console.log('New current song playing: ', newCurrentSong)
			currentSong = newCurrentSong
			twitchClient.say(channel, `Now playing: ${currentSong}`)
		} else {
      console.log('Current song playing has not changed.')
    }
	}, 20000)
}

module.exports = {
	trackCurrentSongPlaying,
}
