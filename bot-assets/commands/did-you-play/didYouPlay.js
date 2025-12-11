const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')
const {
	dypSearchTerms,
	getCurrentPlaylistSummary,
} = require('../../command-use/commandUse')
const { formatTimeSince } = require('../now-playing/timeSinceHelpers')

const dypCommand = async (
	channel,
	tags,
	args,
	twitchClient,
	obs,
	url,
	config
) => {
	const obsClearDisplayTime = config.obsClearDisplayTime

	// Require a query after the command
	if (args.length === 0) {
		twitchClient.say(
			channel,
			`Add an artist's name after the command to see if ${config.twitchChannelName} has played them in this stream.`
		)
		return
	}

	try {
		const data = getCurrentPlaylistSummary()
		if (data === undefined) {
			twitchClient.say(channel, NO_LIVE_DATA_MESSAGE)
			return
		}

		if (data.total_tracks_played < 2) {
			twitchClient.say(
				channel,
				`${config.twitchChannelName} hasn't played enough music in this stream to search just yet.`
			)
			return
		}

		const searchItem = args.join(' ').trim()
		const searchTerm = searchItem.toLowerCase()
		dypSearchTerms.push({ name: searchItem })

		// track_log is ordered oldest -> newest; collect all matches.
		// Prefer matching against the full original title when available so
		// viewers can search for remix/extra text that may have been
		// stripped from the cleaned track_id for auto ID / Spotify usage.
		const searchResults = data.track_log.filter((entry) => {
			const searchableTitle = (
				entry.full_track_id ||
				entry.track_id ||
				''
			).toLowerCase()
			return searchableTitle.includes(searchTerm)
		})
		console.log('SEARCH RESULTS: ', searchResults)

		if (searchResults.length === 0) {
			const msg = `${config.twitchChannelName} has not played '${searchItem}' in this stream yet.`
			twitchClient.say(channel, msg)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'npchatbot-response',
					inputSettings: {
						text: `${config.twitchChannelName} has not played\n'${searchItem}' in this stream yet.`,
					},
				})
				clearOBSResponse(obs, obsClearDisplayTime)
			}
			return
		}

		// Most recent match is the last element in searchResults
		const latestIndex = searchResults.length - 1
		const latestMatch = searchResults[latestIndex]
		const lastSongPlayed = latestMatch.full_track_id || latestMatch.track_id
		const lastTimestamp = latestMatch.timestamp

		let safeTimePlayed = 'earlier in this stream'
		if (lastTimestamp && lastTimestamp !== 'N/A') {
			const playedAt = new Date(lastTimestamp)
			const isSeeded = latestMatch.source === 'seeded'
			const hasConcreteLength =
				latestMatch.length &&
				latestMatch.length !== '0:00' &&
				latestMatch.length !== 'Still playing'
			safeTimePlayed = formatTimeSince(playedAt, isSeeded, hasConcreteLength)
		}

		const message = `${config.twitchChannelName} has played '${searchItem}' ${searchResults.length} time(s) so far in this stream. Their last song played was "${lastSongPlayed}", ${safeTimePlayed}.`
		twitchClient.say(channel, message)

		if (config.isObsResponseEnabled === true) {
			obs.call('SetInputSettings', {
				inputName: 'npchatbot-response',
				inputSettings: {
					text: `${config.twitchChannelName} has played\n'${searchItem}' ${searchResults.length} time(s) so far in this stream.\n\nTheir last song played was:\n${lastSongPlayed} (${safeTimePlayed})`,
				},
			})
			clearOBSResponse(obs, obsClearDisplayTime)
		}
	} catch (error) {
		console.log('DYP command error: ', error)
		twitchClient.say(channel, ERROR_MESSAGE)
	}
}

module.exports = {
	dypCommand,
}
