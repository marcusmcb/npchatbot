const convertToMilliseconds = (time) => {
	const [hours, minutes, seconds] = time.split(':').map(Number)
	return hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000
}

const parseTimeString = (timeString) => {
	const parts = timeString.split(':')
	const hours = parseInt(parts[0], 10)
	const minutes = parseInt(parts[1], 10)
	const seconds = parseInt(parts[2], 10)
	return { hours, minutes, seconds }
}

const vibeCheckSelector = (trackArray) => {
	
	if (!Array.isArray(trackArray) || trackArray.length === 0) {
		throw new Error('Invalid track array. Ensure it is a non-empty array.')
	}
	let eligibleTracks = []
	if (trackArray.length > 5) {
		// exclude the 4 most recent tracks (indices 0-3)
		eligibleTracks = trackArray.slice(4)
	} else if (trackArray.length > 2) {
		// exclude the current and previous song (indices 0-1)
		eligibleTracks = trackArray.slice(2)
	} else {
		// only one or two tracks, nothing to exclude
		eligibleTracks = []
	}
	if (eligibleTracks.length === 0) {
		throw new Error('Not enough tracks to perform a vibe check.')
	}
	const randomIndex = Math.floor(Math.random() * eligibleTracks.length)
	const vibeCheckData = eligibleTracks[randomIndex]
	return vibeCheckData
}

module.exports = {
	convertToMilliseconds: convertToMilliseconds,
	parseTimeString: parseTimeString,
	vibeCheckSelector: vibeCheckSelector,
}
