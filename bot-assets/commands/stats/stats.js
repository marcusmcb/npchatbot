const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')

const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const sendChatMessage = (twitchClient, channel, username, reportData) => {
	twitchClient.say(
		channel,
		`${username} has played ${reportData.total_tracks_played} songs so far in this set with an average length of ${reportData.average_track_length} per song.`
	)
}

const displayStatsMessage = (obs, tags, reportData, config, trendIndicator) => {
	const obsClearDisplayTime = config.obsClearDisplayTime
	let differenceParsed = parseFloat(reportData.average_change.difference)
		.toString()
		.slice(0, -1)
	const message = `${config.twitchChannelName} has played ${
		reportData.total_tracks_played
	} songs so far\nin this stream at an average of ${
		reportData.average_track_length
	} per song ${trendIndicator}${
		differenceParsed === 'Na' ? 0 : differenceParsed
	}%)`

	obs.call('SetInputSettings', {
		inputName: 'npchatbot-response',
		inputSettings: {
			text: message,
		},
	})
	clearOBSResponse(obs, obsClearDisplayTime)
}

const statsCommand = async (channel, twitchClient, reportData, obs, config, tags) => {
	try {		
		if (reportData === undefined) {
			twitchClient.say(channel, NO_LIVE_DATA_MESSAGE)
			return
		}
		if (reportData.track_log.length < 4) {
			twitchClient.say(
				channel,
				`${config.twitchChannelName} has played ${reportData.total_tracks_played} songs so far in this stream.`
			)
			return
		}

		sendChatMessage(twitchClient, channel, config.twitchChannelName, reportData)

		if (config.isObsResponseEnabled === true) {
			if (reportData.average_change.isLarger) {
				displayStatsMessage(obs, tags, reportData, config, '(↑')
			} else if (
				!reportData.average_change.isLarger &&
				reportData.average_change.difference !== null
			) {
				displayStatsMessage(obs, tags, reportData, config, '(↓')
			} else {
				displayStatsMessage(obs, tags, reportData, config, '(-')
			}
		}
	} catch (err) {
		console.error(err)
		twitchClient.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	statsCommand: statsCommand,
}
