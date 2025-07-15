const getPlaylistSummaryData = async (playlistSummaries) => {
	return new Promise((resolve, reject) => {
		try {
			// Step 1: Collect all track_ids from all playlists
			const trackCountMap = {}
			const trackDetailsMap = {}

			playlistSummaries.forEach((playlist) => {
				if (Array.isArray(playlist.track_log)) {
					playlist.track_log.forEach((track) => {
						const id = track.track_id
						if (!trackCountMap[id]) {
							trackCountMap[id] = 0
							trackDetailsMap[id] = track // Save first occurrence details
						}
						trackCountMap[id]++
					})
				}
			})

			// Step 2: Find tracks that appear in more than one playlist
			const commonTracks = Object.entries(trackCountMap)
				.filter(([id, count]) => count > 1)
				.map(([id, count]) => ({
					track_id: id,
					count,
					details: trackDetailsMap[id],
				}))

			// Step 3: Build summary object
			const summary = {
				totalPlaylists: playlistSummaries.length,
				totalUniqueTracks: Object.keys(trackCountMap).length,
				commonTracks,
			}

			resolve(summary)
		} catch (err) {
			reject(err)
		}
	})
}

module.exports = { getPlaylistSummaryData }
