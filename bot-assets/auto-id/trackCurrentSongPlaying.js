const scrapeData = require('../commands/liveReport/LiveReportHelpers/scrapeData')
const {
	cleanCurrentSongInfo,
	cleanQueryString,
} = require('../spotify/helpers/spotifyPlaylistHelpers')
const { getSpotifySongData } = require('../spotify/getSpotifySongData')
const {
	addTracksToSpotifyPlaylist,
} = require('../spotify/addTracksToSpotifyPlaylist')
const {
	getUniqueSongs,
	hasSongBeenPlayed,
	checkCurrentSong,
} = require('./helpers/autoIdHelpers')

let currentSong = null
let trackingInterval = null
let songsPlayed = []

const addSongToSpotifyPlaylist = async (
	accessToken,
	spotifyPlaylistId,
	currentSong
) => {
	let uri = []
	let spotifySongUri = null
	const songQuery = cleanCurrentSongInfo(currentSong)
	const spotifyQuery = cleanQueryString(songQuery)
	const playedSongs = getUniqueSongs(songsPlayed)
	const doNotAddToSpotify = hasSongBeenPlayed(spotifyQuery, playedSongs) // returns false if the song has NOT been played
	if (doNotAddToSpotify) {
		console.log('Song has already been played.')
	} else {
		spotifySongUri = await getSpotifySongData(accessToken, spotifyQuery)
		uri.push(spotifySongUri)
	}
	if (spotifySongUri !== null) {
		await addTracksToSpotifyPlaylist(accessToken, spotifyPlaylistId, uri)
	}
}

const spotifyPlaylistInit = async (
	accessToken,
	spotifyPlaylistId,
	url,
	isAutoIDCleanupEnabled
) => {
	console.log(
		'Adding all songs from Serato Live Playlist scrape to Spotify playlist...'
	)
	console.log('--------------------')
	const response = await scrapeData(url)
	const results = response[0]
	if (!results || results.length === 0) {
		console.log('No songs found in Serato Live Playlist scrape.')
		console.log('Check that your Serato Live Playlist is active and public.')
		console.log('--------------------')
	} else if (results.length > 0) {
		let songUris = []
		for (let i = 0; i < results.length; i++) {
			const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
			const query = cleanQueryString(songQuery)
			console.log('Spotify Song Query: ', songQuery)
			const spotifySongUri = await getSpotifySongData(accessToken, query)
			songUris.push(spotifySongUri)
			songsPlayed.push(query)
		}
		if (songUris.length > 0) {
			songUris = [...new Set(songUris)]
			setTimeout(async () => {
				await addTracksToSpotifyPlaylist(
					accessToken,
					spotifyPlaylistId,
					songUris
				)
			}, 1000)

			// set the current song playing to the most recent playlist entry
			// and clean up tag if Auto ID Cleanup is enabled
			currentSong = results[0].children[0].data.trim()
			if (isAutoIDCleanupEnabled === true) {
				currentSong = cleanCurrentSongInfo(currentSong)
			}
		} else {
			console.log('No Spotify URIs found for songs in Serato Live Playlist.')
			console.log('--------------------')
		}
	}
}

const trackCurrentSongPlaying = async (config, url, twitchClient) => {
	const channel = `#${config.twitchChannelName}`
	const isSpotifyEnabled = config.isSpotifyEnabled
	const isAutoIDEnabled = config.isAutoIDEnabled
	const isAutoIDCleanupEnabled = config.isAutoIDCleanupEnabled
	const spotifyPlaylistId = config.currentSpotifyPlaylistId
	const accessToken = config.spotifyAccessToken

	// once the user's playlist is live and public,
	// load the tracks found into the user's Spotify playlist

	if (currentSong === null) {
		if (isSpotifyEnabled === true) {
			await spotifyPlaylistInit(
				accessToken,
				spotifyPlaylistId,
				url,
				isAutoIDCleanupEnabled
			)
		}
		setTimeout(() => {
			twitchClient.say(
				channel,
				'npChatbot is now tracking the current song playing.'
			)
		}, 10000)
	}

	trackingInterval = setInterval(async () => {
		let newCurrentSong = await checkCurrentSong(url)
		if (newCurrentSong === null) {
			console.log(
				'No song currently playing.  Please check that your Serato Live Playlist is active and public.'
			)
			return
		}
		if (isAutoIDCleanupEnabled === true) {
			newCurrentSong = cleanCurrentSongInfo(newCurrentSong)
		}
		console.log('Current Song Playing: ', currentSong)
		console.log('New Current Song Playing: ', newCurrentSong)
		if (newCurrentSong !== currentSong) {
			currentSong = newCurrentSong
			// return the current song playing if the Auto ID feature is enabled
			if (isAutoIDEnabled === true) {
				twitchClient.say(channel, `Now playing: ${currentSong}`)
			}
			// update the user's Spotify playlist with the current song playing
			if (isSpotifyEnabled === true) {
				await addSongToSpotifyPlaylist(
					accessToken,
					spotifyPlaylistId,
					currentSong
				)
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
		currentSong = null
		console.log('Auto ID tracking interval successfully ended.')
	}
}

module.exports = {
	trackCurrentSongPlaying,
	endTrackCurrentSongPlaying,
}
