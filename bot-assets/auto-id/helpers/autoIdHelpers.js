const scrapeData = require('../../commands/create-serato-report/helpers/scrapeData')

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

// Helper that returns both the current and previous song titles
// from the Serato Live scrape so we can detect back-to-back
// doubles even when the track title doesn't change between polls.
const checkCurrentSongWithPrevious = async (url) => {
	try {
		const response = await scrapeData(url)
		const results = response[0]
		if (!results || results.length === 0) {
			return { current: null, previous: null }
		}

		const current = results[0].children[0].data.trim()
		const previous =
			results.length > 1 ? results[1].children[0].data.trim() : null

		return { current, previous }
	} catch (error) {
		console.log('Error checking current/previous song playing: ', error)
		return { current: null, previous: null }
	}
}

module.exports = {
	getUniqueSongs,
	hasSongBeenPlayed,
	checkCurrentSong,
	checkCurrentSongWithPrevious,
}
