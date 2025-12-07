const createLiveReport = require('../commands/create-serato-report/createLiveReport')
const { cleanCurrentSongInfo } = require('../spotify/helpers/spotifyPlaylistHelpers')
const {
	lengthToMs,
} = require('../commands/create-serato-report/helpers/liveReportHelpers')

let currentSong = null
let tracklog = []

// helper to format milliseconds into M:SS
const formatMsToMinSec = (ms) => {
	if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return '0:00'
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const reset = () => {
	currentSong = null
	tracklog = []
}

// Seed the in-memory track log from an initial scrape so that
// sessions started mid-set still have historical tracks represented.
// Existing lengths are only approximate (derived from Serato "ago" data);
// the currently playing track length is set to null to allow live tracking.
const seedFromLiveReport = async (url, isAutoIDCleanupEnabled) => {
	if (tracklog.length > 0) return // prevent duplicate seeding
	try {
		const reportData = await createLiveReport(url)
		const scrapedLog = reportData?.track_log
		if (!Array.isArray(scrapedLog) || scrapedLog.length === 0) return

		// scrapedLog[0] is the currently playing track (length "Still playing")
		// We rebuild ordering oldest->newest so track_number increments naturally.
		const seeded = []
		for (let i = scrapedLog.length - 1; i >= 0; i--) {
			const entry = scrapedLog[i]
			if (!entry) continue
			const rawId = entry.track_id
			const cleanedId = isAutoIDCleanupEnabled
				? cleanCurrentSongInfo(rawId)
				: rawId
			seeded.push({
				track_number: seeded.length + 1,
				track_id: cleanedId,
				full_track_id: rawId,
				timestamp:
					entry.timestamp && entry.timestamp !== 'N/A'
						? entry.timestamp
						: new Date().toISOString(),
				length: entry.length === 'Still playing' ? null : entry.length,
				source: 'seeded',
			})
		}
		tracklog = seeded
		currentSong = tracklog.length > 0 ? tracklog[tracklog.length - 1].track_id : null
		console.log(
			'Initial tracklog seeded from existing Serato playlist. Count:',
			tracklog.length
		)
	} catch (e) {
		console.log('Failed to seed initial tracklog:', e?.message || e)
	}
}

// Handle a detected song change: update previous track length (if applicable)
// and append the new track as the current one.
const handleSongChange = (newCurrentSong, isAutoIDCleanupEnabled) => {
	if (!newCurrentSong) return

	// apply cleanup if enabled to keep IDs consistent with seed
	const cleaned = isAutoIDCleanupEnabled
		? cleanCurrentSongInfo(newCurrentSong)
		: newCurrentSong

	const now = new Date()
	const last = tracklog[tracklog.length - 1]

	// Only update length for tracks that were added live, so we
	// don't overwrite seeded lengths from the initial scrape.
	if (last && last.timestamp && last.source !== 'seeded') {
		try {
			const lastTs = new Date(last.timestamp)
			const delta = now.getTime() - lastTs.getTime()
			last.length = formatMsToMinSec(delta > 0 ? delta : 0)
		} catch (_e) {
			// leave last.length as-is if parsing fails
		}
	}

	// push the new current song with current timestamp; length is unknown yet
	tracklog.push({
		track_number: tracklog.length + 1,
		track_id: cleaned,
		full_track_id: newCurrentSong,
		timestamp: now.toISOString(),
		length: null,
		source: 'live',
	})

	currentSong = cleaned
}

const getCurrentTracklog = () => tracklog.slice()

const getCurrentSong = () => currentSong

// Build a live "report" snapshot derived from the current in-memory tracklog.
// This mirrors the structure used by createLiveReport for the fields
// consumed by commands (track_log, shortest/longest, doubles, averages).
const getLiveReportSnapshot = () => {
	// Use a shallow copy so consumers can't mutate internal state.
	const log = getCurrentTracklog()
	if (!log || log.length === 0) {
		return {
			track_log: [],
			total_tracks_played: 0,
			average_track_length: { minutes: 0, seconds: 0 },
			doubles_played: [],
			shortest_track: null,
			longest_track: null,
		}
	}

	// For now, treat total_tracks_played as unique tracks, matching
	// createLiveReport semantics.
	const uniqueTracks = new Set(log.map((track) => track.track_id))
	const totalTracksPlayed = uniqueTracks.size

	// Only consider tracks with a concrete length string.
	const validTracks = log.filter(
		(track) => track.length && track.length !== '0:00' && track.length !== 'Still playing'
	)

	const validLengthsMs = validTracks.map((track) => lengthToMs(track.length))
	const averageLengthMs =
		validLengthsMs.length > 0
			? validLengthsMs.reduce((sum, length) => sum + length, 0) /
			  validLengthsMs.length
			: 0

	const averageTrackLength = {
		minutes: Math.floor(averageLengthMs / 60000),
		seconds: Math.floor((averageLengthMs % 60000) / 1000),
	}

	// Shortest and longest tracks by length.
	let shortestSong = null
	let longestSong = null
	validTracks.forEach((track) => {
		if (!shortestSong || lengthToMs(track.length) < lengthToMs(shortestSong.length)) {
			shortestSong = track
		}
		if (!longestSong || lengthToMs(track.length) > lengthToMs(longestSong.length)) {
			longestSong = track
		}
	})

	// Identify doubles: adjacent entries with the same track_id.
	// We store each double with the timestamp of the *second* track
	// in the pair so "time since doubles" refers to when the repeat
	// actually occurred. When multiple doubles are present for the
	// same track, later pairs will naturally appear later in this
	// array, allowing callers to treat the last entry as the most
	// recent instance.
	const doublesPlayed = []
	for (let i = 0; i < log.length - 1; i++) {
		if (log[i].track_id === log[i + 1].track_id) {
			doublesPlayed.push({
				track_id: log[i].track_id,
				time_played: log[i + 1].timestamp,
			})
		}
	}

	// Expose source on each track_log entry so callers can distinguish
	// between historical seeded entries and live-tracked entries.
	return {
		track_log: log,
		total_tracks_played: totalTracksPlayed,
		average_track_length: averageTrackLength,
		doubles_played: doublesPlayed,
		shortest_track: shortestSong
			? {
					track_id: shortestSong.track_id,
					length: shortestSong.length,
					time_played: shortestSong.timestamp,
			  }
			: null,
		longest_track: longestSong
			? {
					track_id: longestSong.track_id,
					length: longestSong.length,
					time_played: longestSong.timestamp,
			  }
			: null,
	}
}

module.exports = {
	seedFromLiveReport,
	handleSongChange,
	getCurrentTracklog,
	getCurrentSong,
	getLiveReportSnapshot,
	reset,
}
