const {
	npSongsQueried,
	dypSearchTerms,
} = require('../command-use/commandUse')

// Compute set length from track_log timestamps (last-hour robustness)
function computeSetLengthFromTrackLog(trackLog = []) {
	const times = trackLog
		.map((t) => {
			if (!t || !t.timestamp || t.timestamp === 'N/A') return null
			const d = new Date(t.timestamp)
			return isNaN(d.getTime()) ? null : d
		})
		.filter(Boolean)

	if (times.length < 2) {
		return { hours: 0, minutes: 0, seconds: 0 }
	}

	const minTime = new Date(Math.min(...times.map((d) => d.getTime())))
	const maxTime = new Date(Math.max(...times.map((d) => d.getTime())))
	let durationMs = maxTime.getTime() - minTime.getTime()
	if (durationMs < 0) durationMs = 0

	const hours = Math.floor(durationMs / (1000 * 60 * 60))
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)

	return { hours, minutes, seconds }
}

function monthIndexFromName(name = '') {
	const months = [
		'january','february','march','april','may','june',
		'july','august','september','october','november','december',
	]
	return months.indexOf(String(name).toLowerCase())
}

function parseStartDateTime(playlistDateStr, setStartTimeStr) {
	if (!playlistDateStr || !setStartTimeStr) return null
	// Example playlistDateStr: "Saturday, September 27th, 2025"
	const m = playlistDateStr.match(/^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?,\s+(\d{4})$/)
	if (!m) return null
	const [, monthName, dayStr, yearStr] = m
	const monthIdx = monthIndexFromName(monthName)
	const day = parseInt(dayStr, 10)
	const year = parseInt(yearStr, 10)
	if (monthIdx < 0 || !day || !year) return null

	// setStartTimeStr: "10:12 PM"
	const tm = setStartTimeStr.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)
	if (!tm) return null
	let hours12 = parseInt(tm[1], 10)
	const minutes = parseInt(tm[2], 10)
	const period = tm[3].toUpperCase()
	if (isNaN(hours12) || isNaN(minutes)) return null
	// Convert to 24-hour
	let hours24 = hours12 % 12
	if (period === 'PM') hours24 += 12

	return new Date(year, monthIdx, day, hours24, minutes, 0, 0)
}

function computeSetLengthFromMeta(sessionDate, playlistDateStr, setStartTimeStr) {
	const session = sessionDate instanceof Date ? sessionDate : new Date(sessionDate)
	const start0 = parseStartDateTime(playlistDateStr, setStartTimeStr)
	if (!start0 || isNaN(session.getTime())) return null

	const startMinus1 = new Date(start0)
	startMinus1.setDate(startMinus1.getDate() - 1)

	const dur0 = Math.max(0, session.getTime() - start0.getTime())
	const dur1 = Math.max(0, session.getTime() - startMinus1.getTime())

	// Choose the more plausible duration (larger but under 24h)
	const candidateMs = [dur0, dur1].filter((d) => d >= 0 && d <= 24 * 3600 * 1000)
	const durationMs = candidateMs.length ? Math.max(...candidateMs) : Math.max(dur0, dur1)

	const hours = Math.floor(durationMs / (1000 * 60 * 60))
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
	return { hours, minutes, seconds }
}

// add most played artists to the playlist summary

const createPlaylistSummary = async (summaryData) => {    

	const sessionDate = new Date()

	// Prefer duration from meta (session_date, playlist_date, set_start_time)
	const metaComputed = computeSetLengthFromMeta(
		sessionDate,
		summaryData.playlist_date,
		summaryData.set_start_time
	)
	// Fallback to track-log derived duration (may only reflect last hour of data)
	const logComputed = computeSetLengthFromTrackLog(summaryData.track_log)
	const computedSetLength = metaComputed || logComputed

	const setLengthHours = computedSetLength.hours
	const setLengthMinutes = computedSetLength.minutes
	const setLengthSeconds = computedSetLength.seconds

	const finalSummaryData = {
		session_date: sessionDate,
		dj_name: summaryData.dj_name,
		set_start_time: summaryData.set_start_time,
		playlist_date: summaryData.playlist_date,
		average_track_length_minutes: summaryData.average_track_length.minutes,
		average_track_length_seconds: summaryData.average_track_length.seconds,
		total_tracks_played: summaryData.total_tracks_played,
		set_length: summaryData.set_length?.length_value,
		set_length_hours: setLengthHours,
		set_length_minutes: setLengthMinutes,
		set_length_seconds: setLengthSeconds,
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
