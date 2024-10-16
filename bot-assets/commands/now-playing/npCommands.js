const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const { shortestTrackCommand } = require('../stats/shortestTrack')
const { longestTrackCommand } = require('../stats/longestTrack')
const { doublesCommand } = require('../stats/doublesPlayed')
const { npSongsQueried } = require('../../command-use/commandUse')

const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const {
	parseTimeString,
	vibeCheckSelector,
} = require('../now-playing/npCommandHelpers/npCommandHelpers')
const { statsCommand } = require('../stats/stats')

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
	twitchClient.say(channel, 'npChatbot is properly linked to your Twitch channel.')
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
	const currentTrackPlaying =
		reportData.track_log[reportData.track_log.length - 1]
	const message = `Now playing: ${currentTrackPlaying.trackId}`
	npSongsQueried.push({ name: currentTrackPlaying.trackId })
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`Now playing:\n${currentTrackPlaying.trackId}`,
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
	const previousTrackPlayed =
		reportData.track_log[reportData.track_log.length - 2]
	const message = `Previous song: ${previousTrackPlayed.trackId}`
	npSongsQueried.push({ name: previousTrackPlayed.trackId })
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`Previous song:\n${previousTrackPlayed.trackId}`,
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
	const firstTrackPlayed = reportData.track_log[0]
	const message = `${config.twitchChannelName} kicked off this stream with ${firstTrackPlayed.trackId}`
	twitchClient.say(channel, message)
	updateOBSWithText(
		obs,
		`${config.twitchChannelName} kicked off this stream with :\n${firstTrackPlayed.trackId}`,
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
	const { hours, minutes, seconds } = parseTimeString(
		vibeCheckSelection.timeSincePlayed
	)
	if (hours > 0) {
		if (hours > 1) {
			const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${hours} hours & ${minutes} minutes ago in this stream.`
			twitchClient.say(channel, message)
			updateOBSWithText(
				obs,
				`vibecheck:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${hours} hours & ${minutes} minutes ago in this stream.`,
				obsClearDisplayTime,
				config
			)
		} else {
			const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${hours} hour & ${minutes} minutes ago in this stream.`
			twitchClient.say(channel, message)
			updateOBSWithText(
				obs,
				`vibecheck:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${hours} hour & ${minutes} minutes ago in this stream.`,
				obsClearDisplayTime,
				config
			)
		}
	} else {
		const message = `${config.twitchChannelName} played "${vibeCheckSelection.trackId}" ${minutes} minutes ago in this stream.`
		twitchClient.say(channel, message)
		updateOBSWithText(
			obs,
			`vibe check:\n\n${config.twitchChannelName} played\n"${vibeCheckSelection.trackId}"\n${minutes} minutes ago in this stream.`,
			obsClearDisplayTime,
			config
		)
	}
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
	shortestTrackCommand(channel, twitchClient, reportData, obs, config, tags)
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
	longestTrackCommand(channel, twitchClient, reportData, obs, config, tags)
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
	doublesCommand(channel, twitchClient, reportData, obs, config, tags)
}

const handleStats = (
	channel,
	twitchClient,
	reportData,
	obs,
	obsClearDisplayTime,
	config,
	tags
) => {
	console.log('--------------> ', config.twitchChannelName)
	statsCommand(channel, twitchClient, reportData, obs, config, tags)
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

const npCommands = async (channel, tags, args, twitchClient, obs, url, config) => {
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
