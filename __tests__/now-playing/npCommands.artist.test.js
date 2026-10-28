jest.mock('../../obs/obsHelpers/obsHelpers', () => jest.fn())
jest.mock('../../database/helpers/playlistSummaries/getArtistPlayHistory', () => ({
	getArtistPlayHistory: jest.fn(),
}))

const { npCommands } = require('../../bot-assets/commands/now-playing/npCommands')
const { setCurrentPlaylistSummary } = require('../../bot-assets/command-use/commandUse')
const { getArtistPlayHistory } = require('../../database/helpers/playlistSummaries/getArtistPlayHistory')
const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')
const { ERROR_MESSAGE, NO_LIVE_DATA_MESSAGE } = require('../../bot-assets/constants/constants')

const now = new Date('2026-10-24T12:00:00.000Z')
const config = { twitchChannelName: 'TestDJ', isObsResponseEnabled: true, obsClearDisplayTime: 5 }
let client
let obs

const run = (options = config, args = ['artist']) =>
	npCommands('#testdj', {}, args, client, obs, 'https://serato.com/playlists/TestDJ/live', options)

beforeEach(() => {
	jest.useFakeTimers().setSystemTime(now)
	client = { say: jest.fn() }
	obs = { call: jest.fn() }
	getArtistPlayHistory.mockResolvedValue([])
	setCurrentPlaylistSummary({
		track_log: [{ track_id: 'Daft Punk - One More Time', timestamp: now.toISOString() }],
	})
})

afterEach(() => {
	setCurrentPlaylistSummary(undefined)
	jest.useRealTimers()
})

test('routes !np artist, awaits history, and reports exactly 23 plays in chat and OBS', async () => {
	const track_log = Array.from({ length: 22 }, (_, index) => ({
		track_id: 'Daft Punk - Around the World',
		timestamp: new Date(now.getTime() - (index + 1) * 1000).toISOString(),
	}))
	getArtistPlayHistory.mockResolvedValue([{ track_log }])
	await run()
	const message = 'TestDJ has played Daft Punk 23 times in the last 30 days. Daft Punk is currently the most played artist in this channel over the last 30 days.'
	expect(getArtistPlayHistory).toHaveBeenCalledWith(config)
	expect(client.say).toHaveBeenCalledTimes(1)
	expect(client.say).toHaveBeenCalledWith('#testdj', message)
	expect(obs.call).toHaveBeenCalledWith('SetInputSettings', {
		inputName: 'npchatbot-response',
		inputSettings: {
			text: 'TestDJ has played Daft Punk 23 times in the last 30 days.\nDaft Punk is currently the most played artist\nin this channel over the last 30 days.',
		},
	})
	expect(clearOBSResponse).toHaveBeenCalledWith(obs, 5)
})

test('includes the current play once and respects disabled OBS with singular wording', async () => {
	await run({ ...config, isObsResponseEnabled: false })
	expect(client.say).toHaveBeenCalledWith('#testdj', 'TestDJ has played Daft Punk 1 time in the last 30 days. Daft Punk is currently the most played artist in this channel over the last 30 days.')
	expect(obs.call).not.toHaveBeenCalled()
})

test('reports the 16th most played artist when fifteen artists have more plays', async () => {
	const track_log = Array.from({ length: 15 }, (_, index) => [
		{ track_id: `Artist ${index} - One`, timestamp: now.toISOString() },
		{ track_id: `Artist ${index} - Two`, timestamp: now.toISOString() },
	]).flat()
	getArtistPlayHistory.mockResolvedValue([{ track_log }])
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj',
		'TestDJ has played Daft Punk 1 time in the last 30 days. Daft Punk is currently the 16th most played artist in this channel over the last 30 days.')
})

test.each([
	[[], 'the most played artist'],
	[[
		{ track_id: 'Leader - One', timestamp: now.toISOString() },
		{ track_id: 'Leader - Two', timestamp: now.toISOString() },
	], 'the 2nd most played artist'],
])('explicitly describes ties for first and lower places', async (leaders, ranking) => {
	getArtistPlayHistory.mockResolvedValue([{ track_log: [
		...leaders, { track_id: 'Other Artist - Song', timestamp: now.toISOString() },
	] }])
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj',
		`TestDJ has played Daft Punk 1 time in the last 30 days. Daft Punk is currently tied for ${ranking} in this channel over the last 30 days.`)
})

test('reports zero when there are no timestamp-qualified plays', async () => {
	setCurrentPlaylistSummary({ track_log: [{
		track_id: 'Daft Punk - Song', timestamp: '2026-01-01T00:00:00.000Z',
	}] })
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj', 'TestDJ has played Daft Punk 0 times in the last 30 days. Daft Punk is currently unranked in this channel over the last 30 days.')
})

test.each([undefined, { track_log: [] }])('handles missing live data without querying history: %p', async (summary) => {
	setCurrentPlaylistSummary(summary)
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj', NO_LIVE_DATA_MESSAGE)
	expect(getArtistPlayHistory).not.toHaveBeenCalled()
})

test('handles an unidentifiable artist without querying history', async () => {
	setCurrentPlaylistSummary({ track_log: [{ track_id: 'Unknown' }] })
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj', expect.stringContaining("couldn't identify the artist"))
	expect(getArtistPlayHistory).not.toHaveBeenCalled()
})

test('catches asynchronous database rejection instead of reporting a successful zero count', async () => {
	getArtistPlayHistory.mockRejectedValue(new Error('Database unavailable'))
	await run()
	expect(client.say).toHaveBeenCalledTimes(1)
	expect(client.say).toHaveBeenCalledWith('#testdj', ERROR_MESSAGE)
})

test('advertises the new subcommand for unknown options', async () => {
	await run(config, ['not-a-command'])
	expect(client.say).toHaveBeenCalledWith('#testdj', expect.stringContaining('!np artist'))
})
