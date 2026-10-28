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
const config = {
	twitchChannelName: 'TestDJ',
	isObsResponseEnabled: true,
	isAutoIDCleanupEnabled: false,
	obsClearDisplayTime: 5,
}
const track = (title, timestamp = now.toISOString()) => ({ full_track_id: title, timestamp })
let client
let obs
const run = (options = config, args = ['rank']) =>
	npCommands('#testdj', {}, args, client, obs, '', options)

beforeEach(() => {
	jest.useFakeTimers().setSystemTime(now)
	client = { say: jest.fn() }
	obs = { call: jest.fn() }
	getArtistPlayHistory.mockResolvedValue([])
	setCurrentPlaylistSummary({ track_log: [track('Daft Punk - One More Time (Remix A)')] })
})

afterEach(() => {
	setCurrentPlaylistSummary(undefined)
	jest.useRealTimers()
})

test('routes rank, groups versions with cleanup disabled and sends the same response to chat and OBS', async () => {
	getArtistPlayHistory.mockResolvedValue([{ track_log: [
		track('Daft Punk - One More Time [Remix B]'),
	] }])
	await run()
	const message = "One More Time by Daft Punk is the most played song in this channel. It's been played 2 times in the past 30 days."
	expect(getArtistPlayHistory).toHaveBeenCalledWith(config)
	expect(client.say).toHaveBeenCalledTimes(1)
	expect(client.say).toHaveBeenCalledWith('#testdj', message)
	expect(obs.call).toHaveBeenCalledWith('SetInputSettings', {
		inputName: 'npchatbot-response',
		inputSettings: {
			text: "One More Time by Daft Punk is the most played song\nin this channel. It's been played 2 times in the past 30 days.",
		},
	})
	expect(clearOBSResponse).toHaveBeenCalledWith(obs, 5)
})

test('preserves artist metadata, cleans only title and respects disabled OBS', async () => {
	setCurrentPlaylistSummary({ track_log: [track('Artist-Name (Collective) - Song [Remix]')] })
	await run({ ...config, isObsResponseEnabled: false })
	expect(client.say).toHaveBeenCalledWith('#testdj',
		"Song by Artist-Name (Collective) is the most played song in this channel. It's been played 1 time in the past 30 days.")
	expect(obs.call).not.toHaveBeenCalled()
})

test('reports the 16th rank against grouped song totals, not artist totals', async () => {
	const log = Array.from({ length: 15 }, (_, index) => [
		track(`Same Artist - Song ${index} (Remix A)`),
		track(`Same Artist - Song ${index} [Remix B]`),
	]).flat()
	getArtistPlayHistory.mockResolvedValue([{ track_log: log }])
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj',
		"One More Time by Daft Punk is the 16th most played song in this channel. It's been played 1 time in the past 30 days.")
})

test.each([
	[[], 'the most played song'],
	[[track('Leader - Song'), track('Leader - Song [Remix]')], 'the 2nd most played song'],
])('describes tied ranks explicitly', async (leaders, ranking) => {
	getArtistPlayHistory.mockResolvedValue([{ track_log: [...leaders, track('Other - Song')] }])
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj',
		`One More Time by Daft Punk is tied for ${ranking} in this channel. It's been played 1 time in the past 30 days.`)
})

test('reports zero and unranked when the song has no qualifying plays', async () => {
	setCurrentPlaylistSummary({ track_log: [track('Daft Punk - One More Time', '2000-01-01T00:00:00.000Z')] })
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj',
		"One More Time by Daft Punk is currently unranked in this channel. It's been played 0 times in the past 30 days.")
})

test.each([undefined, { track_log: [] }, {}])('handles absent live data: %p', async (summary) => {
	setCurrentPlaylistSummary(summary)
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj', NO_LIVE_DATA_MESSAGE)
	expect(getArtistPlayHistory).not.toHaveBeenCalled()
})

test.each(['Unknown', 'Artist - [Remix]'])('handles invalid metadata without querying history: %s', async (title) => {
	setCurrentPlaylistSummary({ track_log: [track(title)] })
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj', expect.stringContaining("couldn't identify the artist and title"))
	expect(getArtistPlayHistory).not.toHaveBeenCalled()
})

test('surfaces rejected history lookups instead of sending a rank', async () => {
	getArtistPlayHistory.mockRejectedValue(new Error('Database unavailable'))
	await run()
	expect(client.say).toHaveBeenCalledTimes(1)
	expect(client.say).toHaveBeenCalledWith('#testdj', ERROR_MESSAGE)
})

test('advertises !np rank in the command fallback', async () => {
	await run(config, ['unknown'])
	expect(client.say).toHaveBeenCalledWith('#testdj', expect.stringContaining('!np rank'))
})
