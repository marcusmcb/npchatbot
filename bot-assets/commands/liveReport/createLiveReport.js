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
	console.log('------------------')
	console.log('URL: ', url)
	console.log('------------------')
	const playlistArtistName = extractPlaylistName(url)
	try {
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

		// Build the track log with lengths included
		const trackLog = tracksPlayed.map((trackId, index) => {
			const timestamp = trackTimestamps[index]
			const lengthMs = timeDiffs[index]
			return {
				trackId,
				timestamp: timestamp ? timestamp.toISOString() : 'N/A',
				timePlayed: timestamps[index]?.children?.[0]?.data?.trim(),
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

		console.log('Track Log: ', trackLog)
		console.log('------------------')

		console.log('Tracks Played: ')
		console.log(tracksPlayed)
		console.log('------------------')
		console.log('Timestamps (example): ')
		console.log(timestamps[1].children[0].data.trim())
		console.log('------------------')
		console.log('Start Time: ')
		console.log(starttime)
		console.log('------------------')
		console.log('Playlist Date: ')
		console.log(playlistdate)
		console.log('------------------')

		// check track log length to determine seratoLiveReport data returned
		// full data will be returned for playlists with 4 or more tracks played

		// the logic for determining average track length, etc could produce
		// errors until at 3-4 tracks have been played in the stream

		if (trackLog.length < 4) {
			// playlist length & parse hours/minutes/seconds
			let playlistLength = timestamps.last().text().trim()
			let playlistLengthValues = parseTimeValues(playlistLength)

			// playlist date formatting
			let playlistDateFormatted =
				playlistdate.split(' ')[1] +
				' ' +
				playlistdate.split(' ')[0] +
				', ' +
				playlistdate.split(' ')[2]

			const seratoLiveReport = {
				track_length_array: timeDiffs,
				dj_name: playlistArtistName,
				set_length: {
					length_value: playlistLength,
					hours: new Number(playlistLengthValues[0]),
					minutes: new Number(playlistLengthValues[1]),
					seconds: new Number(playlistLengthValues[2]),
				},
				set_start_time: startTimeString,
				total_tracks_played: trackLog.length,
				longest_track: null,
				shortest_track: null,
				average_track_length: null,
				average_change: null,
				track_log: trackLog,
				doubles_played: null,
				playlist_date: playlistDateFormatted,
				playlist_title: playlistTitle,
				track_array: tracksPlayed,
			}
			return seratoLiveReport
		} else {
			// create an array of track lengths in MS and send to
			// calculateAverageTime to convert and return average

			let msArray = []
			let shortOutlierThreshold
			let longOutlierThreshold

			for (let i = 0; i < trackLog.length - 1; i++) {
				msArray.push(trackLog[i]['length'])
			}

			// set outlier thresholds based on number of tracks played so far
			if (trackLog.length < 50) {
				longOutlierThreshold = 2
				shortOutlierThreshold = -2
			} else {
				longOutlierThreshold = 3
				shortOutlierThreshold = -3
			}

			let lastMSArray = msArray.slice(0, -1)

			// filter out outliers from the track length array
			let {
				filteredArray: longFilteredMSArray,
				removedOutliers: longOutliers,
			} = filterLongOutliers(msArray, longOutlierThreshold)
			let {
				filteredArray: finalFilteredMSArray,
				removedOutliers: shortOutliers,
			} = filterShortOutliers(longFilteredMSArray, shortOutlierThreshold)

			// determine the average track length for the set after outliers are removed
			let averageTrackLength = calculateAverageTime(finalFilteredMSArray)
			let previousAverageTrackLength = calculateAverageTime(lastMSArray)
			let averageDifference = compareTimes(
				averageTrackLength,
				previousAverageTrackLength
			)

			// console.log('MS Array: ', msArray)
			// console.log('MS Array Length: ', msArray.length)
			console.log('---------------')
			console.log('Long Outliers Removed:', longOutliers)
			console.log('Short Outliers Removed:', shortOutliers)
			console.log('Total Tracks Played: ', trackLog.length)
			// console.log('Longest Track Value: ', longestTrackValue)
			// console.log('Second Longest Track Value: ', secondLongestTrackValue)
			// console.log('Actual Average: ', actualAverage)
			// console.log('Adjusted Average: ', adjustedAverage)
			console.log('---------------')

			// * * * * * * * * * * * * * * *
			//
			// longest track length behavior explained:
			//
			// this is a quirk of the live playlist feature in Serato that
			// occurs when the current track playing is stopped and another
			// track is not immediately played thereafter.  Serato's live
			// playlist does not account for this, logging only the time that
			// each track begins playing.  if another track is not played
			// after the current one (ex, the DJ stops the music to speak
			// on mic) the "gap time" in the live playlist is simply added
			// to whichever song the DJ last played before the pause/break
			//
			// this behavior results in an average track length that isn't
			// entirely accurate when used in the !stats command.  to account
			// for this, a helper method should be added to make the correct
			// determination for which averaging method should be used
			//
			// * * * * * * * * * * * * * * *

			// Determine the longest track from the original array
			let longestSeconds,
				longestMinutes,
				maxIndex,
				longestTrackName,
				longestTrackPlayedAt,
				timeSinceLongestPlayed,
				lengthValue,
				longestTrack,
				tempLongestSeconds

			const longestTrackValue = Math.max(...msArray)
			const isOutlier = longOutliers.includes(longestTrackValue)

			maxIndex = msArray.indexOf(longestTrackValue)
			longestTrackName = trackLog[maxIndex].trackId
			longestTrackPlayedAt = trackLog[maxIndex].timestamp
			longestTrack = Math.abs(
				(trackTimestamps[maxIndex] - trackTimestamps[maxIndex + 1]) / 1000
			)
			longestMinutes = Math.floor(longestTrack / 60) % 60
			tempLongestSeconds = longestTrack % 60
			longestSeconds =
				tempLongestSeconds.toString().length === 1
					? '0' + tempLongestSeconds
					: tempLongestSeconds

			const longestTrackDifference = calculateTimeDifference(
				trackLog[trackLog.length - 1].timestamp,
				trackLog[maxIndex].timestamp
			)

			timeSinceLongestPlayed = formatTimeSincePlayedString(
				longestTrackDifference
			)
			lengthValue = `${longestMinutes}:${longestSeconds}`

			// * * * * * * * * * * * * * * *
			//
			// shortest track played logic
			//
			// set a cutoff value to qualify a track as "played"
			// to account for live playlist errors that occur when
			// a DJ momentarily plays a portion of a track (cut sessions, etc)
			// without playing it in full thereafter
			//
			// any tracks below the cutoff length should be removed
			// from the timeDiffs array and used to calculate the
			// shortest track played below
			//
			// add cutoff length as a dynamic value that can be set
			// by the user in the UI with a default value of 30 seconds
			// which will be used in dev/testing
			//
			// * * * * * * * * * * * * * * *

			let shortestSeconds
			let min = Math.min(...timeDiffs)
			let minIndex = timeDiffs.indexOf(min)
			let shortestTrack = Math.abs(
				(trackTimestamps[minIndex] - trackTimestamps[minIndex + 1]) / 1000
			)
			let shortestMinutes = Math.floor(shortestTrack / 60) % 60
			let tempShortestSeconds = shortestTrack % 60

			// check length of shortest seconds for display parsing
			if (tempShortestSeconds.toString().length === 1) {
				shortestSeconds = '0' + tempShortestSeconds
			} else {
				shortestSeconds = tempShortestSeconds
			}

			// playlist length & parse hours/minutes/seconds
			let playlistLength = timestamps.last().text().trim()
			let playlistLengthValues = parseTimeValues(playlistLength)

			// playlist date formatting
			let playlistDateFormatted =
				playlistdate.split(' ')[1] +
				' ' +
				playlistdate.split(' ')[0] +
				', ' +
				playlistdate.split(' ')[2]

			const shortestTrackDifference = calculateTimeDifference(
				trackLog[trackLog.length - 1].timestamp,
				trackLog[minIndex].timestamp
			)

			const timeSinceShortestPlayed = formatTimeSincePlayedString(
				shortestTrackDifference
			)

			let trackLengths = trackLog.map((track, index) => ({
				name: track.trackId,
				length: track.length, // length in milliseconds
				minutes: Math.floor(track.length / 60000), // convert ms to minutes
				seconds: Math.floor((track.length % 60000) / 1000), // remainder seconds
			}))

			let sortedLongest = [...trackLengths].sort((a, b) => b.length - a.length)

			let topThreeLongest = sortedLongest.slice(0, 3).map((track) => ({
				name: track.name,
				length: `${track.minutes}:${track.seconds}`,
			}))

			let doublesPlayedNames = doublesPlayed.map((double) => double.name)
			let filteredShortestTracks = trackLengths.filter(
				(track) => !doublesPlayedNames.includes(track.name)
			)

			let sortedShortest = filteredShortestTracks.sort(
				(a, b) => a.length - b.length
			)

			let topThreeShortest = sortedShortest.slice(0, 3).map((track) => {
				let formattedSeconds = track.seconds.toString().padStart(2, '0')
				return {
					name: track.name,
					length: `${track.minutes}:${formattedSeconds}`,
				}
			})

			const seratoLiveReport = {
				track_length_array: timeDiffs,
				dj_name: playlistArtistName,
				set_length: {
					length_value: playlistLength,
					hours: new Number(playlistLengthValues[0]),
					minutes: new Number(playlistLengthValues[1]),
					seconds: new Number(playlistLengthValues[2]),
				},
				set_start_time: startTimeString,
				total_tracks_played: trackLog.length,
				longest_track: {
					name: longestTrackName,
					played_at: longestTrackPlayedAt,
					time_since_played: timeSinceLongestPlayed,
					length_value: lengthValue,
					minutes: longestMinutes,
					seconds: longestSeconds,
					isOutlier: isOutlier,
				},
				shortest_track: {
					name: trackLog[minIndex].trackId,
					played_at: trackLog[minIndex].timestamp,
					time_since_played: calculateTimeDifference(
						trackLog[trackLog.length - 1].timestamp,
						trackLog[minIndex].timestamp
					),
					time_since_played_string: timeSinceShortestPlayed,
					length_value: shortestMinutes + ':' + shortestSeconds,
					minutes: shortestMinutes,
					seconds: shortestSeconds,
				},
				average_track_length: averageTrackLength,
				average_change: {
					isLarger: averageDifference.averageIncrease,
					difference: averageDifference.difference,
				},
				track_log: trackLog,
				doubles_played: doublesPlayed,
				playlist_date: playlistDateFormatted,
				playlist_title: playlistTitle,
				track_array: tracksPlayed,
				top_three_longest: topThreeLongest,
				top_three_shortest: topThreeShortest,
			}
			// console.log('---------------')
			// console.log('Serato Live Report: ', seratoLiveReport)
			// console.log('---------------')
			return seratoLiveReport
		}
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
