const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const { npSongsQueried } = require('../../command-use/commandUse')
const {	vibeCheckSelector } = require('../now-playing/npCommandHelpers/npCommandHelpers')

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
	const currentTrackPlaying = reportData.track_log[0].trackId
	const message = `Now playing: ${currentTrackPlaying}`
	npSongsQueried.push({ name: currentTrackPlaying })
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`Now playing:\n${currentTrackPlaying}`,
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
	const previousTrackPlayed = reportData.track_log[1].trackId
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
	const firstTrackPlayed =
		reportData.track_log[reportData.track_log.length - 1].trackId
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
	const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${vibeCheckSelection.timePlayed} in this stream.`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`vibe check:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${vibeCheckSelection.timePlayed} in this stream.`,
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
	const shortestTrack = reportData.shortest_track.trackId
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
	const longestTrack = reportData.longest_track.trackId
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
		const message = `${config.twitchChannelName} has played doubles ${timesDoublesPlayed} time(s) in this set.  The last song they played doubles with was "${reportData.doubles_played[0].trackId}", ${reportData.doubles_played[0].timePlayed}.`
		twitchClient.say(channel, message)
		updateOBSWithText(
			obs,
			`${config.twitchChannelName} has played doubles ${timesDoublesPlayed} times so far in this set.\n\nThe last song they played doubles with was:\n"${reportData.doubles_played[0].trackId}"\n${reportData.doubles_played[0].timePlayed}.`,
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
	const averageTrackLength =
		reportData.average_track_length.minutes +
		':' +
		reportData.average_track_length.seconds
	console.log("Average track length: ")
	console.log("Minutes: ", reportData.average_track_length.minutes)
	console.log("Seconds: ", reportData.average_track_length.seconds)
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

		const reportData = await createLiveReport(url)
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
}
