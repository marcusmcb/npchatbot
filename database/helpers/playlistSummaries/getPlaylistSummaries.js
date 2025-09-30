const db = require('../../database')
const {
	formatDateWithSuffix,
} = require('../../../bot-assets/commands/create-serato-report/helpers/liveReportHelpers')

function computeFromTrackLog(trackLog = []) {
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

function monthIndexFromName(name = '') {
	const months = [
		'january','february','march','april','may','june',
		'july','august','september','october','november','december',
	]
	return months.indexOf(String(name).toLowerCase())
}

function parseStartDateTime(playlistDateStr, setStartTimeStr) {
	if (!playlistDateStr || !setStartTimeStr) return null
	const m = playlistDateStr.match(/^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)?,\s+(\d{4})$/)
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

function computeFromMeta(sessionDate, playlistDateStr, setStartTimeStr) {
	const session = sessionDate ? new Date(sessionDate) : null
	const start0 = parseStartDateTime(playlistDateStr, setStartTimeStr)
	if (!session || !start0 || isNaN(session.getTime())) return null

	const startMinus1 = new Date(start0)
	startMinus1.setDate(startMinus1.getDate() - 1)

	const dur0 = Math.max(0, session.getTime() - start0.getTime())
	const dur1 = Math.max(0, session.getTime() - startMinus1.getTime())
	const candidates = [
		{ start: start0, dur: dur0 },
		{ start: startMinus1, dur: dur1 },
	].filter((c) => c.dur >= 0 && c.dur <= 24 * 3600 * 1000)

	const chosen = candidates.length
		? candidates.sort((a, b) => b.dur - a.dur)[0]
		: dur0 >= dur1
		? { start: start0, dur: dur0 }
		: { start: startMinus1, dur: dur1 }

	const hours = Math.floor(chosen.dur / (1000 * 60 * 60))
	const minutes = Math.floor((chosen.dur % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((chosen.dur % (1000 * 60)) / 1000)

	return { hours, minutes, seconds, start: chosen.start }
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
						const metaComputed = computeFromMeta(
							doc.session_date,
							doc.playlist_date,
							doc.set_start_time
						)
						const logComputed = computeFromTrackLog(doc.track_log)
						const computed = metaComputed || logComputed
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

						const startForDate = metaComputed?.start || logComputed.earliest
						if (startForDate) {
							const startDateStr = formatDateWithSuffix(startForDate)
							// Always set for UI
							patched.playlist_date = startDateStr
							// Persist if DB differs
							if (doc.playlist_date !== startDateStr) {
								setOps.playlist_date = startDateStr
							}
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
