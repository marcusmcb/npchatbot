const {
	createLiveReport,
} = require('../commands/create-serato-report/createLiveReport')

const {
	npSongsQueried,
	dypSearchTerms,
} = require('../command-use/commandUse')

const createPlaylistSummary = async (displayName) => {
	const seratoDisplayName = displayName.replaceAll(' ', '_')
	const url = `https://serato.com/playlists/${seratoDisplayName}/live`
	const reportData = await createLiveReport(url)

	console.log('REPORT DATA: ')
	console.log(reportData)
	console.log('--------------------------------------')

	const finalReportData = {
		dj_name: reportData.dj_name,
		set_start_time: reportData.set_start_time,
		playlist_date: reportData.playlist_date,
		average_track_length_minutes: reportData.average_track_length.minutes,
		average_track_length_seconds: reportData.average_track_length.seconds,
		total_tracks_played: reportData.total_tracks_played,
		set_length: reportData.set_length.length_value,
		set_length_hours: reportData.set_length.hours,
		set_length_minutes: reportData.set_length.minutes,
		set_length_seconds: reportData.set_length.seconds,
		// shortest_track_name: reportData.shortest_track.name,
		// shortest_track_length: reportData.shortest_track.length_value,
		// shortest_track_minutes: reportData.shortest_track.minutes,
		// shortest_track_seconds: reportData.shortest_track.seconds,
		// longest_track_name: reportData.longest_track.name,
		// longest_track_length: reportData.longest_track.length_value,
		// longest_track_minutes: reportData.longest_track.minutes,
		// longest_track_seconds: reportData.longest_track.seconds,
		doubles_played: reportData.doubles_played,
		// top_three_longest: reportData.top_three_longest,
		// top_three_shortest: reportData.top_three_shortest,
		np_songs_queried: npSongsQueried,
		dyp_search_terms: dypSearchTerms,
	}

	console.log('--------------------------------------')
	console.log('REPORT DATA: ')
	console.log(finalReportData)
	console.log('--------------------------------------')
}

module.exports = { createPlaylistSummary }
