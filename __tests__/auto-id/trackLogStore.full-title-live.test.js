const trackLogStore = require('../../bot-assets/auto-id/trackLogStore')

const makeNow = () => new Date('2025-12-07T02:30:00.000Z')

describe('trackLogStore live entries preserve full_track_id', () => {
	beforeEach(() => {
		trackLogStore.reset()
	})

	test('handleSongChange keeps full original title while cleaning track_id', () => {
		const rawTitle = 'Artist A - Song Title (Full Tilt Remix)'
		const isAutoIDCleanupEnabled = true

		// Simulate a live song change with a raw Serato title
		trackLogStore.handleSongChange(rawTitle, isAutoIDCleanupEnabled)

		const log = trackLogStore.getCurrentTracklog()
		expect(log).toHaveLength(1)

		const entry = log[0]
		// full_track_id should keep the raw title including remix text
		expect(entry.full_track_id).toBe(rawTitle)
		// track_id should be cleaned (i.e., not include the parenthetical)
		expect(entry.track_id).toBe('Artist A - Song Title')
	})
})
