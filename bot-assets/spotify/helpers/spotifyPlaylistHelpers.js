const scrapeData = require('../../commands/create-serato-report/helpers/scrapeData')

const getCurrentDate = () => {
	const date = new Date()
	const options = { weekday: 'long', month: 'long', day: 'numeric' }

	// format the date using Intl.DateTimeFormat
	let formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)

	// add the appropriate suffix to the day (e.g., "st", "nd", "rd", "th")
	const day = date.getDate()
	const suffix =
		day % 10 === 1 && day !== 11
			? 'st'
			: day % 10 === 2 && day !== 12
			? 'nd'
			: day % 10 === 3 && day !== 13
			? 'rd'
			: 'th'

	// replace the numeric day in the formatted string with the day + suffix
	formattedDate = formattedDate.replace(/\d+/, `${day}${suffix}`)
	return formattedDate
}

const cleanCurrentSongInfo = (songInfo) => {
	const cleaned = songInfo.replace(/\s*[\(\[].*?[\)\]]/g, '').trim()
	return cleaned.replace(/\s+/g, ' ')
}

const cleanQueryString = (queryString) => {
	let cleaned = queryString.toLowerCase()
	cleaned = cleaned.replace(/\s*-\s*/g, ' ')
	cleaned = cleaned.replace(/\s*,\s*/g, ' ')
	cleaned = cleaned.replace(/[&.]/g, '')
	cleaned = cleaned.replace(/\s+/g, ' ').trim()
	return cleaned
}

const getSeratoPlaylistData = async (url) => {
	const response = await scrapeData(url)
	const results = response[0]
	return results
}

module.exports = {
	getCurrentDate,
	cleanCurrentSongInfo,
	cleanQueryString,
	getSeratoPlaylistData,
}
