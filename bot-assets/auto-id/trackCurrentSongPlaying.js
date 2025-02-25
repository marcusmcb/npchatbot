const {
	cleanCurrentSongInfo,
	cleanQueryString,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

const { getSpotifySongData } = require('../spotify/getSpotifySongData')
const { getSpotifyPlaylistData } = require('../spotify/getSpotifyPlaylistData')

const {
	addTracksToSpotifyPlaylist,
} = require('../spotify/addTracksToSpotifyPlaylist')

const {
	getSeratoPlaylistData,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

const {
	getUniqueSongs,
	hasSongBeenPlayed,
	checkCurrentSong,
} = require('./helpers/autoIdHelpers')

/* GLOBAL VALUES */

let currentSong = null
let trackingInterval = null
let songsPlayed = []

const prepSongForSpotifyPlaylist = async (spotifyPlaylistId, currentSong) => {
	let uri = []
	let spotifySongUri = null
	const songQuery = cleanCurrentSongInfo(currentSong)
	const spotifyQuery = cleanQueryString(songQuery)
	const playedSongs = getUniqueSongs(songsPlayed)
	const doNotAddToSpotify = hasSongBeenPlayed(spotifyQuery, playedSongs) // returns false if the song has NOT been played
	if (doNotAddToSpotify) {
		console.log('Song has already been played.')
	} else {
		spotifySongUri = await getSpotifySongData(spotifyQuery)
		uri.push(spotifySongUri)
	}
	if (spotifySongUri !== null) {		
		await addTracksToSpotifyPlaylist(spotifyPlaylistId, uri)
	}
}

// method to resume updating the user's last Spotify playlist
// based on their Serato Live Playlist
const resumeSpotifyPlaylist = async (
	spotifyPlaylistId,
	url,
	isAutoIDCleanupEnabled
) => {
	// create songsPlayed array for tracking
	const results = await getSeratoPlaylistData(url)
	for (let i = 0; i < results.length; i++) {
		const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
		const query = cleanQueryString(songQuery)
		songsPlayed.push(query)
	}

	// compare the current Serato & Spotify playlist lengths and
	// add any missing songs to the Spotify playlist
	const seratoPlaylistLength = results.length
	const spotifyPlaylistLength = await getSpotifyPlaylistData(spotifyPlaylistId)

	if (spotifyPlaylistLength === seratoPlaylistLength) {
		console.log('Spotify playlist is up to date with Serato playlist.')
		console.log('--------------------')
		currentSong = results[0].children[0].data.trim()
		if (isAutoIDCleanupEnabled === true) {
			currentSong = cleanCurrentSongInfo(currentSong)
		}
	} else {
		console.log('Serato Playlist Length: ', seratoPlaylistLength)
		console.log('Spotify Playlist Length: ', spotifyPlaylistLength)
		console.log('--------------------')
		console.log('Songs in Serato Playlist but not in Spotify Playlist: ')
		console.log('--------------------')

		let songUris = []
		const lengthDifference = seratoPlaylistLength - spotifyPlaylistLength
		for (let i = 0; i < lengthDifference; i++) {
			console.log(results[i].children[0].data.trim())
			const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
			const query = cleanQueryString(songQuery)
			const spotifySongUri = await getSpotifySongData(query)
			if (spotifySongUri !== null) {
				songUris.push(spotifySongUri)
			}
		}
		if (songUris.length > 0) {
			songUris = [...new Set(songUris)]
			setTimeout(async () => {
				await addTracksToSpotifyPlaylist(spotifyPlaylistId, songUris)
			}, 1000)
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

// method to create and initially populate the user's Spotify playlist
// based on their Serato Live Playlist
const initSpotifyPlaylist = async (
	spotifyPlaylistId,
	url,
	isAutoIDCleanupEnabled
) => {
	console.log(
		'Adding all songs from Serato Live Playlist scrape to Spotify playlist...'
	)
	console.log('--------------------')
	const results = await getSeratoPlaylistData(url)
	if (!results || results.length === 0) {
		console.log('No songs found in Serato Live Playlist scrape.')
		console.log('Check that your Serato Live Playlist is active and public.')
		console.log('--------------------')
	} else if (results.length > 0) {
		let songUris = []
		for (let i = 0; i < results.length; i++) {
			const songQuery = cleanCurrentSongInfo(results[i].children[0].data.trim())
			const query = cleanQueryString(songQuery)
			songsPlayed.push(query)

			const spotifySongUri = await getSpotifySongData(query)
			if (spotifySongUri !== null) {
				songUris.push(spotifySongUri)
			}
		}
		if (songUris.length > 0) {
			songUris = [...new Set(songUris)]
			setTimeout(async () => {
				await addTracksToSpotifyPlaylist(spotifyPlaylistId, songUris)
			}, 1000)
			currentSong = results[0].children[0].data.trim()
			if (isAutoIDCleanupEnabled === true) {
				currentSong = cleanCurrentSongInfo(currentSong)
			}
			console.log('Serato Playlist Length: ', results.length)
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
	const continueLastPlaylist = config.continueLastPlaylist

	// once the user's playlist is live and public,
	// load the tracks found into the user's Spotify playlist

	if (currentSong === null) {
		if (isSpotifyEnabled === true) {
			if (continueLastPlaylist === true) {
				console.log('Continuing last playlist...')
				console.log('--------------------')
				await resumeSpotifyPlaylist(
					spotifyPlaylistId,
					url,
					isAutoIDCleanupEnabled
				)
			} else {
				console.log('Initializing new playlist...')
				console.log('--------------------')
				await initSpotifyPlaylist(
					spotifyPlaylistId,
					url,
					isAutoIDCleanupEnabled
				)
			}
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

		if (newCurrentSong !== currentSong) {
			currentSong = newCurrentSong
			// return the current song playing if the Auto ID feature is enabled
			if (isAutoIDEnabled === true) {
				twitchClient.say(channel, `Now playing: ${currentSong}`)
			}
			// update the user's Spotify playlist with the current song playing
			if (isSpotifyEnabled === true) {
				await prepSongForSpotifyPlaylist(spotifyPlaylistId, currentSong)
			}
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
