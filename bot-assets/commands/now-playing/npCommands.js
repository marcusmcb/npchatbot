const createLiveReport = require('../create-serato-report/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const { npSongsQueried } = require('../../command-use/commandUse')
const {
	vibeCheckSelector,
} = require('../now-playing/npCommandHelpers/npCommandHelpers')
const { getCurrentPlaylistSummary } = require('../../command-use/commandUse')

const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const NP_OPTIONS =
	'npChatbot options: !np, !np previous, !np start, !np vibecheck, !dyp (query), !np stats, !np doubles, !np shortest, !np longest'

const updateOBSWithText = (obs, text, obsClearDisplayTime, config) => {
	if (config.isObsResponseEnabled) {
		obs.call('SetInputSettings', {
			inputName: 'npchatbot-response',
			inputSettings: { text },
		})
		clearOBSResponse(obs, obsClearDisplayTime)
	}
}

// !np test response
// test this command to either remove it here
// or from the test-command directory
const handleTest = (channel, twitchClient, tags) => {
	twitchClient.say(
		channel,
		'npChatbot is properly linked to your Twitch channel.'
	)
}

// !np options response
const handleOptions = (channel, twitchClient) => {
	const message =
		'You can find the full npChatbot command list at www.npchatbot.com/commands'
	twitchClient.say(channel, message)
}

// !np response
const handleDefault = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config
) => {
	// track_log is ordered oldest -> newest; current song is the last entry
	const latestIndex = reportData.track_log.length - 1
	const currentTrackPlaying =
		latestIndex >= 0 ? reportData.track_log[latestIndex].track_id : 'Unknown'
	const message = `Now playing: ${currentTrackPlaying}`
	npSongsQueried.push({ name: currentTrackPlaying })
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`Now playing: ${currentTrackPlaying}`,
		obsClearDisplayTime,
		config
	)
}

// !np previous response
const handlePrevious = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config
) => {
	// previous track is the one immediately before the latest entry
	const latestIndex = reportData.track_log.length - 1
	const previousIndex = latestIndex - 1
	if (previousIndex < 0) {
		const message = `${config.twitchChannelName} has not played a previous song yet in this stream.`
		twitchClient.say(channel, message)
		updateOBSWithText(obs, message, obsClearDisplayTime, config)
		return
	}
	const previousTrackPlayed = reportData.track_log[previousIndex].track_id
	const message = `Previous song: ${previousTrackPlayed}`
	npSongsQueried.push({ name: previousTrackPlayed })
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`Previous song:\n${previousTrackPlayed}`,
		obsClearDisplayTime,
		config
	)
}

// !np start response
const handleStart = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	// track_log is ordered oldest -> newest; the first song in the set
	// is therefore the first entry in the array.
	const firstIndex = 0
	const firstTrackPlayed =
		reportData.track_log[firstIndex]?.track_id || 'Unknown'
	const message = `${config.twitchChannelName} kicked off this stream with ${firstTrackPlayed}`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`${config.twitchChannelName} kicked off this stream with :\n${firstTrackPlayed}`,
		obsClearDisplayTime,
		config
	)
}

// !np vibecheck response
const handleVibeCheck = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	const vibeCheckSelection = vibeCheckSelector(reportData.track_log)
	console.log('Vibe check selection: ', vibeCheckSelection)
	console.log('---------------------------------')

	// Compute how long ago the selected track was played based on its timestamp.
	// This mirrors the logic used in the !dyp handler so that the time since
	// played is always calculated live from the stored timestamp instead of
	// relying on any static "time_played" text from the original scrape.
	let safeTimePlayed = 'earlier in this stream'
	if (
		vibeCheckSelection &&
		vibeCheckSelection.timestamp &&
		vibeCheckSelection.timestamp !== 'N/A'
	) {
		const playedAt = new Date(vibeCheckSelection.timestamp)
		if (!Number.isNaN(playedAt.getTime())) {
			const now = new Date()
			let diffMs = now.getTime() - playedAt.getTime()
			if (diffMs < 0) diffMs = 0
			const diffMinutes = Math.floor(diffMs / 60000)
			const diffHours = Math.floor(diffMinutes / 60)
			const remainingMinutes = diffMinutes % 60

			if (diffHours > 0) {
				safeTimePlayed = `${diffHours} hour${
					diffHours === 1 ? '' : 's'
				} and ${remainingMinutes} minute${
					remainingMinutes === 1 ? '' : 's'
				} ago`
			} else if (diffMinutes > 0) {
				safeTimePlayed = `${diffMinutes} minute${
					diffMinutes === 1 ? '' : 's'
				} ago`
			} else {
				safeTimePlayed = 'just now'
			}
		}
	}

	const message = `${config.twitchChannelName} played "${vibeCheckSelection.track_id}" ${safeTimePlayed} in this stream.`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`vibe check:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.track_id}"\n${safeTimePlayed} in this stream.`,
		obsClearDisplayTime,
		config
	)
}

// !np shortest response
const handleShortest = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	const shortestTrack = reportData.shortest_track.track_id
	const shortestTrackLength = reportData.shortest_track['length']
	const message = `The shortest song that ${config.twitchChannelName} has played in the last hour was ${shortestTrack} (${shortestTrackLength}).`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`The shortest song played in the last hour was:\n\n${shortestTrack}\n(${shortestTrackLength})`,
		obsClearDisplayTime,
		config
	)
}

// !np longest response
const handleLongest = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	const longestTrack = reportData.longest_track.track_id
	const longestTrackLength = reportData.longest_track['length']
	const message = `The longest song that ${config.twitchChannelName} has played in the last hour was ${longestTrack} (${longestTrackLength}).`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`The longest song played in the last hour was:\n\n${longestTrack}\n(${longestTrackLength})`,
		obsClearDisplayTime,
		config
	)
}

// !np doubles response
const handleDoubles = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	if (reportData.doubles_played.length === 0) {
		const message = `${config.twitchChannelName} has not played doubles once during this set (yet).`
		twitchClient.say(channel, message)
		updateOBSWithText(obs, message, obsClearDisplayTime, config)
	} else {
		const timesDoublesPlayed = reportData.doubles_played.length
		// doubles_played is ordered by detection time; the most recent
		// instance is therefore the last element.
		const lastDouble = reportData.doubles_played[timesDoublesPlayed - 1]
		const lastDoubleTrack = lastDouble.track_id
		const lastDoubleTimestamp = lastDouble.time_played

		let timeSinceLastDoubleText = 'earlier in this stream'
		if (lastDoubleTimestamp && lastDoubleTimestamp !== 'N/A') {
			const playedAt = new Date(lastDoubleTimestamp)
			if (!Number.isNaN(playedAt.getTime())) {
				const now = new Date()
				let diffMs = now.getTime() - playedAt.getTime()
				if (diffMs < 0) diffMs = 0
				const diffMinutes = Math.floor(diffMs / 60000)
				const diffHours = Math.floor(diffMinutes / 60)
				const remainingMinutes = diffMinutes % 60

				if (diffHours > 0) {
					timeSinceLastDoubleText = `${diffHours} hour${
						diffHours === 1 ? '' : 's'
					} and ${remainingMinutes} minute${
						remainingMinutes === 1 ? '' : 's'
					} ago`
				} else if (diffMinutes > 0) {
					timeSinceLastDoubleText = `${diffMinutes} minute${
						diffMinutes === 1 ? '' : 's'
					} ago`
				} else {
					timeSinceLastDoubleText = 'just now'
				}
			}
		}

		const message = `${config.twitchChannelName} has played doubles ${timesDoublesPlayed} time(s) in this set. The last song they played doubles with was "${lastDoubleTrack}", about ${timeSinceLastDoubleText}.`
		twitchClient.say(channel, message)
		updateOBSWithText(
			obs,
			`${config.twitchChannelName} has played doubles ${timesDoublesPlayed} times so far in this set.\n\nThe last song they played doubles with was:\n"${lastDoubleTrack}"\n(about ${timeSinceLastDoubleText}).`,
			obsClearDisplayTime,
			config
		)
	}
}

// !np stats response
const handleStats = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	const minutes = reportData.average_track_length.minutes
	let seconds = reportData.average_track_length.seconds
	if (typeof seconds === 'number') {
		seconds = seconds < 10 ? '0' + seconds : String(seconds)
	} else {
		seconds = String(seconds)
	}
	const averageTrackLength = minutes + ':' + seconds
	console.log('Average track length: ')
	console.log('Minutes: ', minutes)
	console.log('Seconds: ', seconds)
	const totalTracksPlayed = reportData.total_tracks_played
	const message = `${config.twitchChannelName} has played ${totalTracksPlayed} songs so far in this set with an average track length of ${averageTrackLength}.`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`${config.twitchChannelName} has played ${totalTracksPlayed} tracks so far\nwith an average track length of ${averageTrackLength}`,
		obsClearDisplayTime,
		config
	)
}

// !np playlist response
const handlePlaylist = (channel, twitchClient, config) => {
	if (config.isSpotifyEnabled && config.currentSpotifyPlaylistLink) {
		twitchClient.say(
			channel,
			`If you're enjoying the tunes, check out ${config.twitchChannelName}'s Spotify playlist for this live stream here: ${config.currentSpotifyPlaylistLink}`
		)
	} else {
		twitchClient.say(
			channel,
			`${config.twitchChannelName} does not have a Spotify playlist set up for this stream.`
		)
	}
}

const COMMAND_MAP = {
	undefined: handleDefault,
	previous: handlePrevious,
	start: handleStart,
	vibecheck: handleVibeCheck,
	options: handleOptions,
	test: handleTest,
	shortest: handleShortest,
	longest: handleLongest,
	doubles: handleDoubles,
	stats: handleStats,
	playlist: handlePlaylist,
}

const npCommands = async (
	channel,
	tags,
	args,
	twitchClient,
	obs,
	url,
	config
) => {
	const obsClearDisplayTime = config.obsClearDisplayTime
	try {
		const handler = COMMAND_MAP[args[0]]
		if (args[0] === 'test') {
			handler(channel, twitchClient, tags)
			return
		}
		if (args[0] === 'playlist') {
			handler(channel, twitchClient, config)
			return
		}
		if (args[0] === 'options') {
			handler(channel, twitchClient)
			return
		}
		// replace createLiveReport call with the user's
		// Serato Live Playlist data stored as

		const reportData = getCurrentPlaylistSummary()
		// const reportData = await createLiveReport(url)
		if (reportData === undefined) {
			twitchClient.say(channel, NO_LIVE_DATA_MESSAGE)
			return
		}

		if (handler) {
			console.log('np Command handler: ', handler)
			handler(
				channel,
				twitchClient,
				reportData,
				obs,
				obsClearDisplayTime,
				config,
				tags
			)
		} else {
			twitchClient.say(channel, NP_OPTIONS)
		}
	} catch (error) {
		console.log('np Command error: ', error)
		twitchClient.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	npCommands,
	handleVibeCheck,
	handleStart,
}
