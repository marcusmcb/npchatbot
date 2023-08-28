const createLiveReport = require('./createLiveReport')
const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')

const sendChatMessage = (client, channel, username, reportData) => {
	client.say(
		channel,
		`${username} has played ${reportData.total_tracks_played} songs so far in this set with an average length of ${reportData.average_track_length} per song.`
	)
}

const displayStatsMessage = (obs, tags, reportData, config, trendIndicator) => {
	const obsClearDisplayTime = config.obsClearDisplayTime
	let differenceParsed = parseFloat(reportData.average_change.difference)
		.toString()
		.slice(0, -1)
	const message = `${tags.username} has played ${
		reportData.total_tracks_played
	} songs so far\nin this stream at an average of ${
		reportData.average_track_length
	} per song ${trendIndicator}${
		differenceParsed === 'Na' ? 0 : differenceParsed
	}%)`

	obs.call('SetInputSettings', {
		inputName: 'obs-chat-response',
		inputSettings: {
			text: message,
		},
	})
	clearOBSResponse(obs, obsClearDisplayTime)
}

const statsCommand = async (channel, tags, args, client, obs, url, config) => {
	try {
		const reportData = await createLiveReport(url)
		if (reportData.total_tracks_played === 0) {
			client.say(
				channel,
				'Sorry, no playlist stats for this stream at the moment.'
			)
			return
		}

		sendChatMessage(client, channel, tags.username, reportData)

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
		client.say(channel, "That doesn't appear to be working right now.")
	}
}

module.exports = {
	statsCommand: statsCommand,
}
