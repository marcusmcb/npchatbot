const {
	extractSong,
	getSongPlayStats,
} = require('../../bot-assets/commands/now-playing/artistHistoryHelpers')

const now = Date.parse('2026-10-24T12:00:00.000Z')
const day = 24 * 60 * 60 * 1000
const track = (title, timestamp = now) => ({
	full_track_id: title,
	timestamp: new Date(timestamp).toISOString(),
})
const song = { artist: 'Daft Punk', title: 'One More Time' }

test('splits before cleanup and preserves artist tags and internal hyphens', () => {
	expect(extractSong(track('  Artist-Name (Collective) [DJ] - One   More Time (Remix A) [Edit]')))
		.toEqual({ artist: 'Artist-Name (Collective) [DJ]', title: 'One More Time' })
	expect(extractSong({ full_track_id: ' ', track_id: 'Daft Punk - One More Time [Edit]' }))
		.toEqual(song)
	expect(extractSong(track('Artist - Song - Part Two (Remix)')))
		.toEqual({ artist: 'Artist', title: 'Song - Part Two' })
})

test.each([null, {}, track('Unknown'), track(' - Song'), track('Artist - (Remix)')])(
	'rejects unidentifiable songs: %p',
	(value) => expect(extractSong(value)).toBeNull()
)

test('groups versions only when both artist and cleaned title match', () => {
	const log = [
		track('Daft Punk - One More Time (Remix A)'),
		track('daft   punk - one more   time [Remix B]'),
		track('Daft Punk - One More Time'),
		track('Daft Punk - One More'),
		track('Other Artist - One More Time'),
		track('Daft Punk (Tribute) - One More Time'),
	]
	expect(getSongPlayStats(song, [], log, now)).toEqual({ count: 3, rank: 1, tied: false })
})

test('deduplicates snapshots before grouping, preserving distinct versions and repeats', () => {
	const remixA = track('Daft Punk - One More Time (Remix A)')
	const remixB = track('Daft Punk - One More Time [Remix B]')
	const repeated = track('Daft Punk - One More Time (Remix A)', now - 1000)
	const saved = [
		{ track_log: [remixA, remixA, remixB, repeated] },
		{ track_log: [remixA, remixB, repeated] },
	]
	expect(getSongPlayStats(song, saved, [remixA, remixB, repeated], now))
		.toEqual({ count: 4, rank: 1, tied: false })
})

test('uses individual timestamps with inclusive boundaries and rejects invalid timestamps', () => {
	const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
	try {
		const log = [
			track('Daft Punk - One More Time (Remix A)', now - 30 * day),
			track('Daft Punk - One More Time [Remix B]', now),
			track('Daft Punk - One More Time', now - 30 * day - 1),
			track('Daft Punk - One More Time', now + 1),
			{ track_id: 'Daft Punk - One More Time', timestamp: 'N/A' },
		]
		expect(getSongPlayStats(song, [{ session_date: '2000-01-01', track_log: log }, {}], [], now))
			.toEqual({ count: 2, rank: 1, tied: false })
		expect(warning).toHaveBeenCalledWith(expect.stringContaining('skipped 1'))
	} finally {
		warning.mockRestore()
	}
})

test('shares competition ranks and skips ranks after ties', () => {
	const log = [
		track('Leader - A'), track('Leader - A [Remix]'),
		track('Leader - B'), track('Leader - B (Remix)'),
		track('Daft Punk - One More Time'),
		track('Other - Song'),
	]
	expect(getSongPlayStats(song, [], log, now)).toEqual({ count: 1, rank: 3, tied: true })
	expect(getSongPlayStats({ artist: 'Leader', title: 'A' }, [], log, now))
		.toEqual({ count: 2, rank: 1, tied: true })
})

test('does not rank a song without qualifying plays', () => {
	expect(getSongPlayStats(song, [], [track('Other - Song')], now))
		.toEqual({ count: 0, rank: null, tied: false })
})
