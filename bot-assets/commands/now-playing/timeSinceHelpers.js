// Shared helper to format a human-friendly "time since" string from a Date.
// Used by both npCommands and didYouPlay so that !dyp, !np vibecheck,
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

	// For seeded history where we *don't* yet know the final
	// track length (e.g. length is 0:00 or null), timestamps
	// can be especially misleading. In that case, always fall
	// back to coarse wording so we never claim "just now".
	if (isSeeded && !hasConcreteLength) {
		if (diffHours >= 1) {
			return `about ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
		}
		// Less than an hour but seeded with no concrete length:
		// still avoid pretending we know exact minutes.
		return 'earlier in this stream'
	}

	// For live or trustworthy timestamps, keep the
	// original precise behavior.
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

module.exports = {
	formatTimeSince,
}
