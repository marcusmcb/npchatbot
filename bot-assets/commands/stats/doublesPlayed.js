// const createLiveReport = require('../liveReport/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')

const doublesCommand = async (
	channel,
	twitchClient,
	reportData,
	obs,
	config,
	tags
) => {
	try {
		// const reportData = await createLiveReport(url)
		if (reportData === undefined) {
			twitchClient.say(channel, NO_LIVE_DATA_MESSAGE)
			return
		} else if (reportData.total_tracks_played < 4) {
			twitchClient.say(
				channel,
				`${config.twitchChannelName} hasn't played enough music in this stream just yet to determine if doubles were played.`
			)
			return
		} else if (reportData.doubles_played.length === 0) {
			twitchClient.say(
				channel,
				`${channel.slice(1)} has not rocked doubles so far in this set.`
			)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'npchatbot-response',
					inputSettings: {
						text: `${config.twitchChannelName} has not rocked doubles so far in this set.`,
					},
				})
				clearOBSResponse(obs, config.obsClearDisplayTime)
			}
		} else {
			twitchClient.say(
				channel,
				`${channel.slice(1)} has rocked doubles ${
					reportData.doubles_played.length
				} time(s) so far in this set.  The last song they played doubles with was ${
					reportData.doubles_played[reportData.doubles_played.length - 1]
						.name
				}.`
			)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'npchatbot-response',
					inputSettings: {
						text: `${config.twitchChannelName} has rocked doubles\n${
							reportData.doubles_played.length
						} time(s) so far in this set.\n\nLast song they played doubles with:\n${
							reportData.doubles_played[reportData.doubles_played.length - 1]
								.name
						}`,
					},
				})
				clearOBSResponse(obs, config.obsClearDisplayTime)
			}
		}
	} catch (error) {
		console.log('Doubles command error: ', error)
		twitchClient.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	doublesCommand: doublesCommand,
}
