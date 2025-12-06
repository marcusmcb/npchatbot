const trackLogStore = require('../../bot-assets/auto-id/trackLogStore')

// Mock cleanCurrentSongInfo so we can control IDs
jest.mock('../../bot-assets/spotify/helpers/spotifyPlaylistHelpers', () => ({
	cleanCurrentSongInfo: (s) => s,
}))

const { handleSongChange, getCurrentTracklog, reset, getLiveReportSnapshot } = trackLogStore

describe('trackLogStore doubles behaviour', () => {
	beforeEach(() => {
		reset()
	})

	test('records back-to-back plays of the same track as doubles', () => {
		// First play
		handleSongChange('Same Track', false)
		// Simulate some time passing by manipulating timestamps
		const log1 = getCurrentTracklog()
		expect(log1).toHaveLength(1)

		// Second play (double)
		handleSongChange('Same Track', false)
		const log2 = getCurrentTracklog()
		expect(log2).toHaveLength(2)

		// Entries should be adjacent with identical IDs
		expect(log2[0].track_id).toBe('Same Track')
		expect(log2[1].track_id).toBe('Same Track')

		// Snapshot should report one double
		const snapshot = getLiveReportSnapshot()
		expect(snapshot.doubles_played).toHaveLength(1)
		expect(snapshot.doubles_played[0].track_id).toBe('Same Track')
	})
})
