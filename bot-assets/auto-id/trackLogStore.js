const createLiveReport = require('../commands/create-serato-report/createLiveReport')
const { cleanCurrentSongInfo } = require('../spotify/helpers/spotifyPlaylistHelpers')

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

	if (cleaned === currentSong) return

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
		timestamp: now.toISOString(),
		length: null,
		source: 'live',
	})

	currentSong = cleaned
}

const getCurrentTracklog = () => tracklog.slice()

const getCurrentSong = () => currentSong

module.exports = {
	seedFromLiveReport,
	handleSongChange,
	getCurrentTracklog,
	getCurrentSong,
	reset,
}
