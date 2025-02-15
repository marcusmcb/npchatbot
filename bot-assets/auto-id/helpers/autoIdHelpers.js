const scrapeData = require('../../commands/liveReport/LiveReportHelpers/scrapeData')

const getUniqueSongs = (songArray) => {
	return [...new Set(songArray)]
}

const hasSongBeenPlayed = (query, songArray) => {
	return songArray.includes(query)
}

const checkCurrentSong = async (url) => {
	try {
		const response = await scrapeData(url)
		const results = response[0]
		if (results.length > 0) {
			return results[0].children[0].data.trim()
		} else {
			return null
		}
	} catch (error) {
		console.log('Error checking current song playing: ', error)
		return null
	}
}

module.exports = {
	getUniqueSongs,
	hasSongBeenPlayed,
	checkCurrentSong,
}
