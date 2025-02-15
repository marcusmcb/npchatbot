// extract playlist name from serato scrape
const extractPlaylistName = (inputString) => {
	const regex = /playlists\/(.*?)\//
	const match = regex.exec(inputString)
	if (match && match[1]) {
		const playlistName = match[1].replace(/_/g, ' ')
		return playlistName
	} else {
		return null
	}
}

// helper method to return playlist date string
const formatDateWithSuffix = (date) => {
	const daySuffixes = ['th', 'st', 'nd', 'rd']
	const day = date.getDate()
	const dayOfWeek = new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
	}).format(date)
	const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
	const year = date.getFullYear()

	// Determine the suffix (st, nd, rd, th)
	const suffix =
		day % 10 <= 3 && Math.floor(day / 10) !== 1 ? daySuffixes[day % 10] : 'th'

	return `${dayOfWeek}, ${month} ${day}${suffix}, ${year}`
}

// helper function to convert length string to milliseconds
const lengthToMs = (length) => {
	if (length === '0:00' || length === 'Still playing') return Infinity // ignore invalid lengths for shortest song
	const [minutes, seconds] = length.split(':').map(Number)
	return minutes * 60000 + seconds * 1000
}

// utility function to transform timePlayed strings
const transformTimePlayed = (timePlayed) => {
	if (!timePlayed) return null
	// match the pattern 'number unit ago'
	const match = timePlayed.match(/^(\d+)\s(\w+)\sago$/)
	if (!match) return timePlayed // if it doesn't match, return the original value
	const [, value, unit] = match
	// determine the full unit
	let fullUnit
	if (unit.startsWith('min')) {
		fullUnit = value === '1' ? 'minute' : 'minutes'
	} else if (unit.startsWith('hr')) {
		fullUnit = value === '1' ? 'hour' : 'hours'
	} else if (unit.startsWith('sec')) {
		fullUnit = value === '1' ? 'second' : 'seconds'
	} else {
		fullUnit = unit // default to the original unit if it's unrecognized
	}
	return `${value} ${fullUnit} ago`
}

module.exports = {
	extractPlaylistName,
	formatDateWithSuffix,
	lengthToMs,
	transformTimePlayed,
}
