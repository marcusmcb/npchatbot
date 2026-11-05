const { getTopArtists } = require('../../bot-assets/commands/now-playing/artistHistoryHelpers')

const now = Date.parse('2026-11-05T12:00:00.000Z')
const day = 24 * 60 * 60 * 1000
const track = (artist, title, time = now) => ({
	track_id: `${artist} - ${title}`,
	timestamp: new Date(time).toISOString(),
})
const pair = (artist, time = now) => [
	track(artist, 'One', time - 1000),
	track(artist, 'Two', time),
]

test('requires two plays and ranks by count before recency', () => {
	const log = [
		...pair('Recent'),
		...pair('Leader', now - day),
		track('Leader', 'Three', now - day),
		track('Single', 'Only'),
	]
	expect(getTopArtists([], log, now)).toEqual([
		{ name: 'Leader', count: 3, lastPlayed: now - day },
		{ name: 'Recent', count: 2, lastPlayed: now },
	])
})

test('caps the list at five and breaks count ties by latest play, then alphabetically', () => {
	const log = [
		...pair('Oldest', now - 5 * day),
		...pair('Older', now - 4 * day),
		...pair('Middle', now - 3 * day),
		...pair('Newer', now - 2 * day),
		...pair('Zulu'),
		...pair('Alpha'),
	]
	expect(getTopArtists([], log, now).map(({ name }) => name)).toEqual([
		'Alpha', 'Zulu', 'Newer', 'Middle', 'Older',
	])
})

test('includes the exact cutoff and now, excluding old, future and invalid plays from counts and recency', () => {
	const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
	try {
		const log = [
			track('Boundary', 'Old', now - 30 * day),
			track('Boundary', 'Current'),
			track('Single', 'Valid'),
			track('Single', 'Too old', now - 30 * day - 1),
			track('Single', 'Future', now + 1),
			{ track_id: 'Single - Invalid', timestamp: 'N/A' },
			...pair('Older', now - day),
			track('Older', 'Future', now + day),
			{ track_id: 'Unknown', timestamp: new Date(now).toISOString() },
			null,
		]
		expect(getTopArtists([{ track_log: log }], [], now)).toEqual([
			{ name: 'Boundary', count: 2, lastPlayed: now },
			{ name: 'Older', count: 2, lastPlayed: now - day },
		])
		expect(warning).toHaveBeenCalledWith(expect.stringContaining('skipped 1'))
	} finally {
		warning.mockRestore()
	}
})

test('deduplicates saved/live snapshots while preserving repeated plays in one log', () => {
	const first = track('Daft Punk', 'Song', now - day)
	const second = track('Daft Punk', 'Song', now - 1000)
	const current = track('Daft Punk', 'Current')
	const single = track('Single', 'Song')
	const histories = [
		{ track_log: [first, first, second, single] },
		{ track_log: [first, second, single] },
	]
	expect(getTopArtists(histories, [first, second, current, single], now)).toEqual([
		{ name: 'Daft Punk', count: 4, lastPlayed: now },
	])
})

test('uses full credits, normalized matching, original metadata and latest-play display casing', () => {
	const log = [
		track('daft   punk', 'One', now - day),
		{ ...track('Wrong Artist', 'Two'), full_track_id: 'Daft Punk - Two (Remix)' },
		...pair('Daft Punk feat. Guest', now - day),
		track('Daft Punk Tribute', 'Only'),
		track('Someone Else', 'Daft Punk'),
	]
	expect(getTopArtists([], log, now)).toEqual([
		{ name: 'Daft Punk', count: 2, lastPlayed: now },
		{ name: 'Daft Punk feat. Guest', count: 2, lastPlayed: now - day },
	])
})

test('returns no artists for absent logs or only single-play artists', () => {
	expect(getTopArtists([{}, { track_log: null }], undefined, now)).toEqual([])
	expect(getTopArtists([], [track('Single', 'Song')], now)).toEqual([])
})
