const {
	extractArtist,
	countArtistPlays,
	getArtistPlayStats,
	formatOrdinal,
} = require('../../bot-assets/commands/now-playing/artistHistoryHelpers')

const now = Date.parse('2026-10-24T12:00:00.000Z')
const day = 24 * 60 * 60 * 1000
const track = (title, time = now) => ({
	track_id: title,
	timestamp: new Date(time).toISOString(),
})

describe('artist history matching and counting', () => {
	test.each([
		[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'],
		[11, '11th'], [12, '12th'], [13, '13th'], [16, '16th'],
		[21, '21st'], [22, '22nd'], [23, '23rd'],
		[101, '101st'], [111, '111th'], [112, '112th'], [113, '113th'],
	])('formats rank %i as %s', (rank, expected) => {
		expect(formatOrdinal(rank)).toBe(expected)
	})

	test('shares competition ranks and skips places after a tie', () => {
		const log = [
			track('Artist A - One'), track('Artist A - Two'),
			track('Artist B - One'), track('Artist B - Two'),
			track('Daft Punk - One'),
		]
		expect(getArtistPlayStats('Artist A', [], log, now)).toEqual({ count: 2, rank: 1, tied: true })
		expect(getArtistPlayStats('Daft Punk', [], log, now)).toEqual({ count: 1, rank: 3, tied: false })
		expect(getArtistPlayStats('Missing', [], log, now)).toEqual({ count: 0, rank: null, tied: false })
	})

	test('ranks normalized artist totals using only qualifying deduplicated plays', () => {
		const shared = track('daft   punk - One')
		const old = track('Old Artist - Song', now - 30 * day - 1)
		const future = track('Future Artist - Song', now + 1)
		const saved = [{ track_log: [shared, old, future, track('Unknown'), {
			track_id: 'Invalid Artist - Song', timestamp: 'N/A',
		}] }]
		const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
		try {
			expect(getArtistPlayStats('Daft Punk', saved, [
				shared, track('Daft Punk - Two'), track('Other Artist - Song'),
			], now)).toEqual({ count: 2, rank: 1, tied: false })
		} finally {
			warning.mockRestore()
		}
	})

	test('extracts the full artist credit and prefers the original title', () => {
		expect(extractArtist({
			full_track_id: '  Daft   Punk - One More Time (Remix)',
			track_id: 'Wrong Artist - Title',
		})).toBe('Daft Punk')
		expect(extractArtist(track('AC-DC - Thunderstruck'))).toBe('AC-DC')
		expect(extractArtist(track('Artist feat. Guest - Song'))).toBe('Artist feat. Guest')
		expect(extractArtist({ full_track_id: ' ', track_id: 'Daft Punk - Song' })).toBe('Daft Punk')
	})

	test.each([undefined, {}, { track_id: 'Unknown' }, { track_id: ' - Song' }, { track_id: 'Artist - ' }])(
		'does not guess an artist for malformed metadata: %p',
		(value) => expect(extractArtist(value)).toBeNull()
	)

	test('counts exactly 23 individual artist plays, not unique songs', () => {
		const log = Array.from({ length: 23 }, (_, index) =>
			track('Daft Punk - One More Time', now - index * day))
		expect(countArtistPlays('Daft Punk', [{ track_log: log }], [], now)).toBe(23)
	})

	test('uses an inclusive rolling 30-day window and excludes future plays', () => {
		const log = [
			track('Daft Punk - Boundary', now - 30 * day),
			track('Daft Punk - Too Old', now - 30 * day - 1),
			track('Daft Punk - Current'),
			track('Daft Punk - Future', now + 1),
		]
		expect(countArtistPlays('Daft Punk', [{ track_log: log }], [], now)).toBe(2)
	})

	test('matches normalized exact artist credits, not substrings or title mentions', () => {
		const log = [
			track('daft   punk - Song'),
			track('Daft Punk Tribute - Song'),
			track('Someone Else - Daft Punk'),
			track('Daft Punk feat. Guest - Song'),
		]
		expect(countArtistPlays('Daft Punk', [], log, now)).toBe(1)
	})

	test('deduplicates overlapping snapshots without dropping genuine repeated rows', () => {
		const first = track('Daft Punk - Song', now - day)
		const second = track('Daft Punk - Song', now - 1000)
		const current = track('Daft Punk - Current')
		const saved = [{ track_log: [first, first, second] }, { track_log: [first, second] }]
		expect(countArtistPlays('Daft Punk', saved, [first, second, current], now)).toBe(4)
	})

	test('logs invalid timestamps and safely handles absent historical logs', () => {
		const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
		try {
			expect(countArtistPlays('Daft Punk', [{}, { track_log: [
				null,
				{ track_id: 'Daft Punk - Song', timestamp: 'N/A' },
				{ track_id: 'Daft Punk - Other', timestamp: null },
			] }], [], now)).toBe(0)
			expect(warning).toHaveBeenCalledWith(expect.stringContaining('skipped 2'))
		} finally {
			warning.mockRestore()
		}
	})
})
