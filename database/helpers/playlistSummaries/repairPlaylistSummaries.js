const db = require('../../database')
const { formatDateWithSuffix } = require('../../../bot-assets/commands/create-serato-report/helpers/liveReportHelpers')

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

async function repairPlaylistSummaries() {
  return new Promise((resolve, reject) => {
    db.playlists.find({}, (err, docs) => {
      if (err) return reject(err)
      let updated = 0
      const ops = []

      docs.forEach((doc) => {
        const { earliest, hours, minutes, seconds } = computeFromTrackLog(doc.track_log)
        const updates = {}

        // Fix negative or obviously wrong values
        if (
          typeof doc.set_length_hours !== 'number' ||
          typeof doc.set_length_minutes !== 'number' ||
          typeof doc.set_length_seconds !== 'number' ||
          doc.set_length_hours < 0 ||
          doc.set_length_minutes < 0 ||
          doc.set_length_seconds < 0
        ) {
          updates.set_length_hours = hours
          updates.set_length_minutes = minutes
          updates.set_length_seconds = seconds
        }

        // Ensure playlist_date reflects the start date
        if (earliest) {
          const startDateStr = formatDateWithSuffix(earliest)
          if (doc.playlist_date !== startDateStr) {
            updates.playlist_date = startDateStr
          }
        }

        if (Object.keys(updates).length > 0) {
          updated += 1
          ops.push(
            new Promise((res, rej) =>
              db.playlists.update({ _id: doc._id }, { $set: updates }, {}, (e) =>
                e ? rej(e) : res()
              )
            )
          )
        }
      })

      Promise.all(ops)
        .then(() => resolve({ total: docs.length, updated }))
        .catch(reject)
    })
  })
}

module.exports = { repairPlaylistSummaries }
