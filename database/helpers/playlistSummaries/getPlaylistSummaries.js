const db = require('../../database')
const {
	formatDateWithSuffix,
} = require('../../../bot-assets/commands/create-serato-report/helpers/liveReportHelpers')

const computeFromTrackLog = (trackLog = []) => {
	const times = (trackLog || [])
		.map((t) => {
			if (!t || !t.timestamp || t.timestamp === 'N/A') return null
			const d = new Date(t.timestamp)
			return isNaN(d.getTime()) ? null : d
		})
		.filter(Boolean)

	if (times.length === 0) {
		return {
			earliest: null,
			latest: null,
			hours: 0,
			minutes: 0,
			seconds: 0,
		}
	}

	const earliest = new Date(Math.min(...times.map((d) => d.getTime())))
	const latest = new Date(Math.max(...times.map((d) => d.getTime())))
	let durationMs = latest.getTime() - earliest.getTime()
	if (durationMs < 0) durationMs = 0

	const hours = Math.floor(durationMs / (1000 * 60 * 60))
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)

	return { earliest, latest, hours, minutes, seconds }
}

const monthIndexFromName = (name = '') => {
	const months = [
		'january',
		'february',
		'march',
		'april',
		'may',
		'june',
		'july',
		'august',
		'september',
		'october',
		'november',
		'december',
	]
	return months.indexOf(String(name).toLowerCase())
}

const parseStartDateTime = (playlistDateStr, setStartTimeStr) => {
	if (!playlistDateStr || !setStartTimeStr) return null
	const m = playlistDateStr.match(
		/^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?,\s+(\d{4})$/
	)
	if (!m) return null
	const [, monthName, dayStr, yearStr] = m
	const monthIdx = monthIndexFromName(monthName)
	const day = parseInt(dayStr, 10)
	const year = parseInt(yearStr, 10)
	if (monthIdx < 0 || !day || !year) return null

	const tm = setStartTimeStr.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i)
	if (!tm) return null
	let hours12 = parseInt(tm[1], 10)
	const minutes = parseInt(tm[2], 10)
	const period = tm[3].toUpperCase()
	if (isNaN(hours12) || isNaN(minutes)) return null
	let hours24 = hours12 % 12
	if (period === 'PM') hours24 += 12

	return new Date(year, monthIdx, day, hours24, minutes, 0, 0)
}

const computeFromCanonical = (sessionDate, canonicalStart) => {
	const session = sessionDate ? new Date(sessionDate) : null
	if (
		!session ||
		!(canonicalStart instanceof Date) ||
		isNaN(canonicalStart.getTime()) ||
		isNaN(session.getTime())
	)
		return null
	let durationMs = session.getTime() - canonicalStart.getTime()
	if (durationMs < 0) durationMs = 0
	if (durationMs > 24 * 3600 * 1000) durationMs = 24 * 3600 * 1000
	const hours = Math.floor(durationMs / (1000 * 60 * 60))
	const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
	return { hours, minutes, seconds }
}

const getCanonicalStart = (doc) => {
	// 1) Prefer authoritative ISO if present
	if (doc.set_start_iso) {
		const d = new Date(doc.set_start_iso)
		if (!isNaN(d.getTime())) return d
	}
	// 2) Otherwise parse clock + playlist_date as-is. The stored set_start_time
	//    is already corrected for the known scrape offset.
	const parsed = parseStartDateTime(doc.playlist_date, doc.set_start_time)
	if (parsed && !isNaN(parsed.getTime())) {
		return parsed
	}
	return null
}

const getPlaylistSummaries = async () => {
	return new Promise((resolve, reject) => {
		db.playlists
			.find({})
			.sort({ session_date: -1 })
			.exec((err, docs) => {
				if (err) {
					console.error('Error fetching playlist summaries:', err)
					reject(err)
				} else {
					const updates = []
					const adjustedDocs = docs.map((doc) => {
						const needsRepair =
							typeof doc.set_length_hours !== 'number' ||
							typeof doc.set_length_minutes !== 'number' ||
							typeof doc.set_length_seconds !== 'number' ||
							doc.set_length_hours < 0 ||
							doc.set_length_minutes < 0 ||
							doc.set_length_seconds < 0
						const canonicalStart = getCanonicalStart(doc)
						const canonicalComputed = canonicalStart
							? computeFromCanonical(doc.session_date, canonicalStart)
							: null
						const logComputed = computeFromTrackLog(doc.track_log)
						const computed = canonicalComputed || logComputed
						const patched = { ...doc }
						const setOps = {}

						// Always use computed values for UI response
						patched.set_length_hours = computed.hours
						patched.set_length_minutes = computed.minutes
						patched.set_length_seconds = computed.seconds

						// Persist if DB differs or if prior values were invalid
						if (
							needsRepair ||
							doc.set_length_hours !== computed.hours ||
							doc.set_length_minutes !== computed.minutes ||
							doc.set_length_seconds !== computed.seconds
						) {
							setOps.set_length_hours = computed.hours
							setOps.set_length_minutes = computed.minutes
							setOps.set_length_seconds = computed.seconds
						}

						const startForDate = canonicalStart || logComputed.earliest
						if (startForDate) {
							const startDateStr = formatDateWithSuffix(startForDate)
							// Always set for UI
							patched.playlist_date = startDateStr
							// Persist if DB differs
							if (doc.playlist_date !== startDateStr) {
								setOps.playlist_date = startDateStr
							}
						}

						// Backfill stable ISO once (do not modify set_start_time here)
						if (!doc.set_start_iso && canonicalStart) {
							setOps.set_start_iso = canonicalStart.toISOString()
						}

						if (Object.keys(setOps).length > 0) {
							updates.push(
								new Promise((res) =>
									db.playlists.update(
										{ _id: doc._id },
										{ $set: setOps },
										{},
										() => res()
									)
								)
							)
						}

						return patched
					})

					Promise.all(updates).finally(() => {
						console.log('Fetched playlist summaries:', adjustedDocs.length)
						console.log('--------------------------------')
						resolve(adjustedDocs)
					})
				}
			})
	})
}
module.exports = { getPlaylistSummaries }
