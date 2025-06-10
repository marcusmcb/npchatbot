const createLiveReport = require('../create-serato-report/createLiveReport')
const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')
const { dypSearchTerms } = require('../../command-use/commandUse')

const dypCommand = async (channel, tags, args, twitchClient, obs, url, config) => {
	const obsClearDisplayTime = config.obsClearDisplayTime
	let searchItem = args.join(' ')
	// check if user has entered a query value after the command
	if (args.length === 0) {
		twitchClient.say(
			channel,
			`Add an artist's name after the command to see if ${config.twitchChannelName} has played them in this stream.`
		)
	} else {
		try {
			const reportData = await createLiveReport(url)
			if (reportData === undefined) {
				twitchClient.say(channel, NO_LIVE_DATA_MESSAGE)
				return
			} else if (reportData.total_tracks_played < 4) {
				twitchClient.say(
					channel,
					`${config.twitchChannelName} hasn't played enough music in this stream to search just yet.`
				)
				return
			} else {						
				let searchResults = []
				let searchTerm = `${args}`.replaceAll(',', ' ')				
				dypSearchTerms.push({ name: searchTerm})
				for (let i = 0; i < reportData.track_log.length; i++) {
					if (
						reportData.track_log[i].track_id
							.toLowerCase()
							.includes(searchTerm.toLowerCase())
					) {
						searchResults.push(reportData.track_log[i])
					}
				}
				console.log("SEARCH RESULTS: ", searchResults)				

				if (searchResults.length === 0) {
					twitchClient.say(
						channel,
						`${config.twitchChannelName} has not played '${searchItem}' so far in this stream.`
					)
					if (config.isObsResponseEnabled === true) {
						obs.call('SetInputSettings', {
							inputName: 'npchatbot-response',
							inputSettings: {
								text: `${config.twitchChannelName} has not played\n'${searchItem}' so far in this stream.`,
							},
						})
						clearOBSResponse(obs, obsClearDisplayTime)
					}
				} else {					
					const lastSongPlayed = searchResults[0].track_id
					const lastSongPlayedTime = searchResults[0].time_played
					const message = `${config.twitchChannelName} has played '${searchItem}' ${searchResults.length} time(s) so far in this stream. Their last song played was "${lastSongPlayed}", played ${lastSongPlayedTime}.`	
					twitchClient.say(channel, message)
					if (config.isObsResponseEnabled === true) {
						obs.call('SetInputSettings', {
							inputName: 'npchatbot-response',
							inputSettings: {
								text: `${config.twitchChannelName} has played\n'${searchItem}' ${searchResults.length} times so far in this stream.\n\nTheir last song played was: \n${lastSongPlayed} \n* played ${lastSongPlayedTime}`,
							},
						})
						clearOBSResponse(obs, obsClearDisplayTime)
					}
				}				
			}
		} catch (error) {
			console.log('DYP command error: ', error)
			twitchClient.say(channel, ERROR_MESSAGE)
		}
	}
}

module.exports = {
	dypCommand: dypCommand,
}
