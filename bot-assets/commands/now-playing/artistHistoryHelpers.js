const { cleanCurrentSongInfo } = require('../../spotify/helpers/spotifyPlaylistHelpers')

const normalizeText = (value) => value.trim().replace(/\s+/g, ' ')

const getTrackTitle = (track) => {
	if (typeof track?.full_track_id === 'string' && track.full_track_id.trim()) {
		return normalizeText(track.full_track_id)
	}
	return typeof track?.track_id === 'string' ? normalizeText(track.track_id) : ''
}

const extractArtist = (track) => {
	const title = getTrackTitle(track)
	const separator = title.indexOf(' - ')
	if (separator <= 0 || !title.slice(separator + 3).trim()) return null
	return title.slice(0, separator).trim()
}

const extractSong = (track) => {
	const title = getTrackTitle(track)
	const artist = extractArtist(track)
	if (!artist) return null
	const songTitle = cleanCurrentSongInfo(title.slice(title.indexOf(' - ') + 3))
	if (!songTitle) return null
	return { artist, title: songTitle }
}

const getSongKey = (song) =>
	JSON.stringify([song.artist.toLowerCase(), song.title.toLowerCase()])

const getPlayStats = (targetKey, playlists, liveTrackLog, now, groupTrack) => {
	const cutoff = now - 30 * 24 * 60 * 60 * 1000
	const plays = new Map()
	let invalidTimestamps = 0

	for (const log of [...playlists.map((playlist) => playlist.track_log), liveTrackLog]) {
		if (!Array.isArray(log)) continue
		const occurrences = new Map()
		for (const track of log) {
			const groupKey = groupTrack(track)
			if (!groupKey) continue
			const timestamp = typeof track.timestamp === 'string'
				? Date.parse(track.timestamp)
				: NaN
			if (!Number.isFinite(timestamp)) {
				invalidTimestamps++
				continue
			}
			if (timestamp < cutoff || timestamp > now) continue
			const key = JSON.stringify([groupKey, getTrackTitle(track).toLowerCase(), timestamp])
			occurrences.set(key, (occurrences.get(key) || 0) + 1)
		}
		// Overlapping snapshots are copies, but repeated rows within a log are plays.
		for (const [key, count] of occurrences) {
			plays.set(key, Math.max(plays.get(key) || 0, count))
		}
	}
	if (invalidTimestamps > 0) {
		console.warn(`Play history: skipped ${invalidTimestamps} entries with invalid timestamps.`)
	}
	const counts = new Map()
	for (const [key, count] of plays) {
		const [groupKey] = JSON.parse(key)
		counts.set(groupKey, (counts.get(groupKey) || 0) + count)
	}
	const count = counts.get(targetKey) || 0
	if (count === 0) return { count, rank: null, tied: false }

	const playCounts = [...counts.values()]
	return {
		count,
		rank: 1 + playCounts.filter((value) => value > count).length,
		tied: playCounts.filter((value) => value === count).length > 1,
	}
}

const getArtistPlayStats = (artist, playlists, liveTrackLog, now = Date.now()) =>
	getPlayStats(normalizeText(artist).toLowerCase(), playlists, liveTrackLog, now,
		(track) => extractArtist(track)?.toLowerCase())

const getSongPlayStats = (song, playlists, liveTrackLog, now = Date.now()) =>
	getPlayStats(getSongKey(song), playlists, liveTrackLog, now, (track) => {
		const parsed = extractSong(track)
		return parsed ? getSongKey(parsed) : null
	})

const countArtistPlays = (artist, playlists, liveTrackLog, now = Date.now()) =>
	getArtistPlayStats(artist, playlists, liveTrackLog, now).count

const formatOrdinal = (rank) => {
	const lastTwo = rank % 100
	if (lastTwo >= 11 && lastTwo <= 13) return `${rank}th`
	const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[rank % 10] || 'th'
	return `${rank}${suffix}`
}

module.exports = {
	extractArtist,
	extractSong,
	countArtistPlays,
	getArtistPlayStats,
	getSongPlayStats,
	formatOrdinal,
}
