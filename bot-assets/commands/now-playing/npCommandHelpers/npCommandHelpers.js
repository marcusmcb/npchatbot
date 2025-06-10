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
	const randomIndex = Math.floor(Math.random() * trackArray.length)
	const vibeCheckData = trackArray[randomIndex]
	return vibeCheckData
}

module.exports = {
	convertToMilliseconds: convertToMilliseconds,
	parseTimeString: parseTimeString,
	vibeCheckSelector: vibeCheckSelector,
}
