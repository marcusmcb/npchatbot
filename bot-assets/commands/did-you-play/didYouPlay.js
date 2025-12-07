const clearOBSResponse = require('../../../obs/obsHelpers/obsHelpers')
const {
	NO_LIVE_DATA_MESSAGE,
	ERROR_MESSAGE,
} = require('../../constants/constants')
const {
	dypSearchTerms,
	getCurrentPlaylistSummary,
} = require('../../command-use/commandUse')

// Shared helper to format a human-friendly "time since" string from a Date.
// The signature mirrors the helper in npCommands so that !dyp, !np vibecheck,
// and !np doubles behave consistently.
const formatTimeSince = (playedAt, isSeeded = false, hasConcreteLength = true) => {
	if (!(playedAt instanceof Date) || Number.isNaN(playedAt.getTime())) {
		return 'earlier in this stream'
	}

	const now = new Date()
	let diffMs = now.getTime() - playedAt.getTime()
	if (diffMs < 0) diffMs = 0

	const diffMinutes = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMinutes / 60)
	const remainingMinutes = diffMinutes % 60

	if (isSeeded && !hasConcreteLength) {
		if (diffHours >= 1) {
			return `about ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
		}
		return 'earlier in this stream'
	}

	if (diffMinutes >= 90) {
		if (diffHours <= 1) {
			return 'about an hour ago'
		}
		return `about ${diffHours} hours ago`
	}

	if (diffHours > 0) {
		return `${diffHours} hour${diffHours === 1 ? '' : 's'} and ${remainingMinutes} minute${
			remainingMinutes === 1 ? '' : 's'
		} ago`
	}

	if (diffMinutes > 0) {
		return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
	}

	return 'just now'
}

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

		if (data.total_tracks_played < 4) {
			twitchClient.say(
				channel,
				`${config.twitchChannelName} hasn't played enough music in this stream to search just yet.`
			)
			return
		}

		const searchItem = args.join(' ').trim()
		const searchTerm = searchItem.toLowerCase()
		dypSearchTerms.push({ name: searchItem })

		// track_log is ordered oldest -> newest; collect all matches
		const searchResults = data.track_log.filter((entry) =>
			entry.track_id.toLowerCase().includes(searchTerm)
		)
		console.log('SEARCH RESULTS: ', searchResults)

		if (searchResults.length === 0) {
			const msg = `${config.twitchChannelName} has not played '${searchItem}' so far in this stream.`
			twitchClient.say(channel, msg)
			if (config.isObsResponseEnabled === true) {
				obs.call('SetInputSettings', {
					inputName: 'npchatbot-response',
					inputSettings: {
						text: msg,
					},
				})
				clearOBSResponse(obs, obsClearDisplayTime)
			}
			return
		}

		// Most recent match is the last element in searchResults
		const latestIndex = searchResults.length - 1
		const latestMatch = searchResults[latestIndex]
		const lastSongPlayed = latestMatch.track_id
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
					text: `${config.twitchChannelName} has played '${searchItem}' ${searchResults.length} times so far in this stream. Their last song played was: ${lastSongPlayed}, ${safeTimePlayed}`,
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
