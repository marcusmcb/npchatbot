const scrapeData = require('../liveReport/LiveReportHelpers/scrapeData')

const {
	extractPlaylistName,
	parseDateAndTime,
	parseStartTime,
	createPlaylistDate,
	formatTimeSincePlayedString,
	calculateTimeDifference,
	compareTimes,
	sumTimeValues,
	filterLongOutliers,
	filterShortOutliers,
	calculateAverageTime,
	parseTimeValues,
} = require('../liveReport/LiveReportHelpers/liveReportHelpers')

const createLiveReport = async (url) => {		
	try {
		const playlistArtistName = extractPlaylistName(url)
		const response = await scrapeData(url)
		const results = response[0]
		let timestamps = response[1]
		const starttime = response[2]
		const playlistdate = response[3]
		const playlistTitle = response[4]
		let tracksPlayed = []
		let trackTimestamps = []
		let startTimeParsed

		// Parse the start time into a Date object
		if (starttime) {
			const [time, period] = starttime.split(/(am|pm)/i)
			const timeParts = time.split(':').map(Number)
			const hours =
				period.toLowerCase() === 'pm' ? timeParts[0] + 12 : timeParts[0]
			const minutes = timeParts[1] || 0
			startTimeParsed = new Date()
			startTimeParsed.setHours(hours, minutes, 0, 0) // Set start time
		} else {
			throw new Error('Start time is missing or invalid.')
		}

		// Calculate the set length
		const now = new Date()
		const durationMs = now - startTimeParsed
		const hours = Math.floor(durationMs / (1000 * 60 * 60))
		const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
		const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)

		// loop through tracks played and clean data from scrape
		for (let i = 0; i < results.length; i++) {
			let trackId = results[i].children[0].data.trim()
			tracksPlayed.push(trackId)
		}

		console.log('Tracks Played: ', tracksPlayed)
		console.log(typeof timestamps)

		// Convert timestamps to an array if necessary
		if (!Array.isArray(timestamps)) {
			timestamps = Array.isArray(timestamps)
				? timestamps
				: Object.values(timestamps) // Try converting object to an array
		}

		timestamps.forEach((timestampObj, index) => {
			const timestampString = timestampObj.children?.[0]?.data?.trim()
			if (timestampString) {
				const timeAgoMatch = timestampString.match(/(\d+)\s(\w+)\sago/)
				if (timeAgoMatch) {
					const [, value, unit] = timeAgoMatch
					const offset = parseInt(value, 10)

					const adjustedTimestamp = new Date(startTimeParsed)
					if (unit.includes('min')) {
						adjustedTimestamp.setMinutes(
							adjustedTimestamp.getMinutes() - offset
						)
					} else if (unit.includes('sec')) {
						adjustedTimestamp.setSeconds(
							adjustedTimestamp.getSeconds() - offset
						)
					}
					trackTimestamps.push(adjustedTimestamp)
				} else {
					console.warn(`Unrecognized timestamp format: ${timestampString}`)
				}
			}
		})

		// Calculate lengths for each track based on timestamp differences
		let timeDiffs = []
		for (let i = 1; i < trackTimestamps.length; i++) {
			const lengthMs = trackTimestamps[i - 1] - trackTimestamps[i] // Subtract earlier from later
			timeDiffs.push(lengthMs > 0 ? lengthMs : 0) // Ensure non-negative lengths
		}
		timeDiffs.unshift(null) // First track is "Still playing"

		const trackLog = tracksPlayed.map((trackId, index) => {
			const timestamp = trackTimestamps[index]
			const lengthMs = timeDiffs[index]
			return {
				trackNumber: tracksPlayed.length - index,
				trackId,
				timestamp: timestamp ? timestamp.toISOString() : 'N/A',
				timePlayed: timestamps[index]?.children?.[0]?.data
					?.trim()
					?.replace(/^0+/, ''), // Remove leading zeros
				length:
					lengthMs !== null
						? `${Math.floor(lengthMs / 60000)}:${(
								Math.floor(lengthMs / 1000) % 60
						  )
								.toString()
								.padStart(2, '0')}`
						: 'Still playing', // First track is currently playing
			}
		})

		// Calculate average track length
		const validLengths = trackLog
			.filter(
				(track) => track.length !== '0:00' && track.length !== 'Still playing'
			) // Exclude invalid lengths
			.map((track) => {
				const [minutes, seconds] = track.length.split(':').map(Number)
				return minutes * 60 * 1000 + seconds * 1000 // Convert to milliseconds
			})

		const averageLengthMs =
			validLengths.reduce((sum, length) => sum + length, 0) /
			(validLengths.length || 1) // Avoid division by zero

		const averageTrackLength = {
			minutes: Math.floor(averageLengthMs / 60000),
			seconds: Math.floor((averageLengthMs % 60000) / 1000),
		}

		// Identify doubles
		const doublesPlayed = []
		for (let i = 0; i < trackLog.length - 1; i++) {
			if (trackLog[i].trackId === trackLog[i + 1].trackId) {
				doublesPlayed.push({
					trackId: trackLog[i].trackId,
					timePlayed: trackLog[i].timePlayed,
				})
			}
		}

		// Format starttime to '9:57 AM'
		if (starttime) {
			const [time, period] = starttime.split(/(am|pm)/i)
			starttimeFormatted = `${time.trim()} ${period.toUpperCase()}`
		} else {
			throw new Error('Start time is missing or invalid.')
		}

		// Get the current date
		const currentDate = new Date()

		// Format the date to "Tuesday, November 26th, 2024"
		const formatDateWithSuffix = (date) => {
			const daySuffixes = ['th', 'st', 'nd', 'rd']
			const day = date.getDate()
			const dayOfWeek = new Intl.DateTimeFormat('en-US', {
				weekday: 'long',
			}).format(date)
			const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
				date
			)
			const year = date.getFullYear()

			// Determine the suffix (st, nd, rd, th)
			const suffix =
				day % 10 <= 3 && Math.floor(day / 10) !== 1
					? daySuffixes[day % 10]
					: 'th'

			return `${dayOfWeek}, ${month} ${day}${suffix}, ${year}`
		}

		const playlistDate = formatDateWithSuffix(currentDate)

		// Helper function to convert length string to milliseconds
		const lengthToMs = (length) => {
			if (length === '0:00' || length === 'Still playing') return Infinity // Ignore invalid lengths for shortest song
			const [minutes, seconds] = length.split(':').map(Number)
			return minutes * 60000 + seconds * 1000
		}

		// Find the shortest song
		const validTracks = trackLog.filter(
			(track) => track.length !== '0:00' && track.length !== 'Still playing'
		)

		let shortestSong = validTracks.reduce((shortest, track) => {
			const trackLengthMs = lengthToMs(track.length)
			return trackLengthMs < lengthToMs(shortest.length) ? track : shortest
		}, validTracks[0] || null) // Use the first valid track or null if no valid tracks

		// Find the longest track
		let longestSong = validTracks.reduce((longest, track) => {
			const trackLengthMs = lengthToMs(track.length)
			return trackLengthMs > lengthToMs(longest.length) ? track : longest
		}, validTracks[0] || null) // Use the first valid track or null if no valid tracks

		const seratoLiveReport = {
			dj_name: playlistArtistName,
			set_start_time: starttimeFormatted,
			set_length: {
				hours,
				minutes,
				seconds,
			},
			total_tracks_played: trackLog.length,
			average_track_length: averageTrackLength,
			doubles_played: doublesPlayed,
			playlist_date: playlistDate,
			shortest_track: shortestSong
				? {
						trackId: shortestSong.trackId,
						length: shortestSong.length,
						timePlayed: shortestSong.timePlayed,
				  }
				: null,
			longest_track: longestSong
				? {
						trackId: longestSong.trackId,
						length: longestSong.length,
						timePlayed: longestSong.timePlayed,
				  }
				: null,
			track_log: trackLog,
		}

		console.log('----------------------')
		console.log('Serato Report: ')
		console.log("DJ Name: ", seratoLiveReport.dj_name)
		console.log("Start Time:", seratoLiveReport.set_start_time)
		console.log("Set Length: ", seratoLiveReport.set_length)
		console.log("Tracks Played: ", seratoLiveReport.total_tracks_played)
		console.log("Avg Track Length: ", seratoLiveReport.average_track_length)
		console.log("Doubles Played: ", seratoLiveReport.doubles_played)
		console.log("Playlist Date: ", seratoLiveReport.playlist_date)
		console.log("Shortest Track: ", seratoLiveReport.shortest_track)
		console.log("Longest Track: ", seratoLiveReport.longest_track)		
		// console.log("Track Array: ", seratoLiveReport.track_array)
		console.log('----------------------')
		return seratoLiveReport
	} catch (err) {
		console.log('Error creating Serato Live report: ', err)
	}
}

module.exports = createLiveReport

// FUTURE DEV NOTES
//
// check if shortest track is part of a doubles pair
//
// add logic to determine longest track played @ time
//
// add logic to determine shortest track played @ time
