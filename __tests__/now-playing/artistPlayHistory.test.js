jest.mock('../../database/database', () => {
	const Datastore = jest.requireActual('nedb')
	return { playlists: new Datastore() }
})

const db = require('../../database/database')
const { getArtistPlayHistory } = require('../../database/helpers/playlistSummaries/getArtistPlayHistory')
const { createPlaylistSummary } = require('../../bot-assets/summary/createPlaylistSummary')
const { getSongPlayStats } = require('../../bot-assets/commands/now-playing/artistHistoryHelpers')

const config = { twitchChannelName: 'TestDJ', seratoDisplayName: 'Serato DJ' }
const insert = (doc) => new Promise((resolve, reject) => {
	db.playlists.insert(doc, (error, result) => error ? reject(error) : resolve(result))
})

beforeEach(() => new Promise((resolve, reject) => {
	db.playlists.remove({}, { multi: true }, (error) => error ? reject(error) : resolve())
}))

test('reads real NeDB histories with channel ownership, legacy DJ ownership and unidentified local histories', async () => {
	const histories = [
		{ label: 'channel', twitch_channel_name: '#testdj', dj_name: 'Other DJ' },
		{ label: 'legacy', dj_name: 'serato_dj' },
		{ label: 'unidentified' },
		{ label: 'other-channel', twitch_channel_name: 'OtherStreamer', dj_name: 'Serato DJ' },
		{ label: 'other-dj', dj_name: 'Other DJ' },
	]
	for (const history of histories) await insert(history)
	const result = await getArtistPlayHistory(config)
	expect(result.map((doc) => doc.label).sort()).toEqual(['channel', 'legacy', 'unidentified'])
})

test('persists new summaries with the Twitch owner and reads them back only for that channel', async () => {
	const summary = await createPlaylistSummary({
		track_log: [{ track_id: 'Daft Punk - Song', timestamp: new Date().toISOString() }],
		average_track_length: { minutes: 3, seconds: 0 },
		total_tracks_played: 1,
	}, config.twitchChannelName)
	await insert(summary)
	const result = await getArtistPlayHistory(config)
	expect(result).toHaveLength(1)
	expect(result[0].twitch_channel_name).toBe('TestDJ')
	expect(result[0].track_log).toEqual(summary.track_log)
	expect(await getArtistPlayHistory({ ...config, twitchChannelName: 'OtherStreamer' })).toEqual([])
})

test('song ranking uses only eligible NeDB histories and merges live versions', async () => {
	const now = Date.parse('2026-10-24T12:00:00.000Z')
	const track = (title) => ({ full_track_id: title, timestamp: new Date(now).toISOString() })
	await insert({
		twitch_channel_name: 'testdj',
		track_log: [track('Daft Punk - One More Time (Remix A)')],
	})
	await insert({
		dj_name: 'serato_dj',
		track_log: [track('Daft Punk - One More Time [Remix B]')],
	})
	await insert({ track_log: [track('Other - Song')] })
	await insert({
		twitch_channel_name: 'OtherStreamer',
		track_log: Array.from({ length: 10 }, () => track('Other - Song')),
	})
	const histories = await getArtistPlayHistory(config)
	expect(getSongPlayStats({ artist: 'Daft Punk', title: 'One More Time' }, histories, [
		track('Daft Punk - One More Time (Remix A)'),
		track('Daft Punk - One More Time (Remix C)'),
	], now)).toEqual({ count: 3, rank: 1, tied: false })
})

test('rejects missing channel identity and database failures', async () => {
	await expect(getArtistPlayHistory({})).rejects.toThrow('Twitch channel')
	const failure = new Error('Database read failed')
	const find = jest.spyOn(db.playlists, 'find').mockImplementation((query, callback) => callback(failure))
	try {
		await expect(getArtistPlayHistory(config)).rejects.toBe(failure)
	} finally {
		find.mockRestore()
	}
})
