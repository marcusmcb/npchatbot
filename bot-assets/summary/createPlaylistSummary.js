const {
	npSongsQueried,
	dypSearchTerms,
} = require('../command-use/commandUse')

// add most played artists to the playlist summary

const createPlaylistSummary = async (summaryData) => {		

	const sessionDate = new Date()

	const finalSummaryData = {
		session_date: sessionDate,
		dj_name: summaryData.dj_name,
		set_start_time: summaryData.set_start_time,
		playlist_date: summaryData.playlist_date,
		average_track_length_minutes: summaryData.average_track_length.minutes,
		average_track_length_seconds: summaryData.average_track_length.seconds,
		total_tracks_played: summaryData.total_tracks_played,
		set_length: summaryData.set_length.length_value,
		set_length_hours: summaryData.set_length.hours,
		set_length_minutes: summaryData.set_length.minutes,
		set_length_seconds: summaryData.set_length.seconds,
		// shortest_track_name: summaryData.shortest_track.name,
		// shortest_track_length: summaryData.shortest_track.length_value,
		// shortest_track_minutes: summaryData.shortest_track.minutes,
		// shortest_track_seconds: summaryData.shortest_track.seconds,
		// longest_track_name: summaryData.longest_track.name,
		// longest_track_length: summaryData.longest_track.length_value,
		// longest_track_minutes: summaryData.longest_track.minutes,
		// longest_track_seconds: summaryData.longest_track.seconds,
		doubles_played: summaryData.doubles_played,
		// top_three_longest: summaryData.top_three_longest,
		// top_three_shortest: summaryData.top_three_shortest,
		np_songs_queried: npSongsQueried,
		dyp_search_terms: dypSearchTerms,
		track_log: summaryData.track_log
	}

	// console.log('--------------------------------------')
	// console.log('OUTGOING REPORT DATA: ')
	// console.log(finalSummaryData)
	// console.log('--------------------------------------')

	return finalSummaryData
}

module.exports = { createPlaylistSummary }
