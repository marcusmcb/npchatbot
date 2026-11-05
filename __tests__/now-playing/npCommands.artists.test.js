jest.mock('../../obs/obsHelpers/obsHelpers', () => jest.fn())
jest.mock('../../database/helpers/playlistSummaries/getArtistPlayHistory', () => ({
	getArtistPlayHistory: jest.fn(),
}))

const { npCommands } = require('../../bot-assets/commands/now-playing/npCommands')
const { setCurrentPlaylistSummary } = require('../../bot-assets/command-use/commandUse')
const { getArtistPlayHistory } = require('../../database/helpers/playlistSummaries/getArtistPlayHistory')
const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')
const { ERROR_MESSAGE, NO_LIVE_DATA_MESSAGE } = require('../../bot-assets/constants/constants')

const now = new Date('2026-11-05T12:00:00.000Z')
const config = { twitchChannelName: 'TestDJ', isObsResponseEnabled: true, obsClearDisplayTime: 5 }
const track = (artist, index = 0) => ({
	track_id: `${artist} - Song ${index}`,
	timestamp: new Date(now.getTime() - index * 1000).toISOString(),
})
const history = (names) => [{ track_log: names.flatMap((name, index) =>
	Array.from({ length: names.length - index + 1 }, (_, play) => track(name, play))) }]
let client
let obs
const run = (options = config, args = ['artists']) =>
	npCommands('#testdj', {}, args, client, obs, undefined, options)

beforeEach(() => {
	jest.useFakeTimers().setSystemTime(now)
	client = { say: jest.fn() }
	obs = { call: jest.fn() }
	getArtistPlayHistory.mockResolvedValue([])
	setCurrentPlaylistSummary(undefined)
})

afterEach(() => {
	setCurrentPlaylistSummary(undefined)
	jest.useRealTimers()
})

test.each([
	[['Daft Punk'], "The most played artist in @TestDJ's streams for the past 30 days is Daft Punk."],
	[['Daft Punk', 'Beastie Boys'], "The 2 most played artists in @TestDJ's streams for the past 30 days are Daft Punk and Beastie Boys."],
	[['Daft Punk', 'Beastie Boys', 'Busta Rhymes'], "The 3 most played artists in @TestDJ's streams for the past 30 days are Daft Punk, Beastie Boys, and Busta Rhymes."],
	[['A', 'B', 'C', 'D'], "The 4 most played artists in @TestDJ's streams for the past 30 days are A, B, C, and D."],
	[['Daft Punk', 'Beastie Boys', 'Missy Elliott', 'The Chemical Brothers', 'Busta Rhymes'],
		"The 5 most played artists in @TestDJ's streams for the past 30 days are Daft Punk, Beastie Boys, Missy Elliott, The Chemical Brothers, and Busta Rhymes."],
])('lists %j with accurate grammar using saved history without live data', async (names, message) => {
	getArtistPlayHistory.mockResolvedValue(history(names))
	await run()
	expect(getArtistPlayHistory).toHaveBeenCalledWith(config)
	expect(client.say).toHaveBeenCalledTimes(1)
	expect(client.say).toHaveBeenCalledWith('#testdj', message)
	expect(obs.call).toHaveBeenCalledWith('SetInputSettings', {
		inputName: 'npchatbot-response',
		inputSettings: { text: `${message.slice(0, message.indexOf(names[0])).trimEnd()}\n${names.join('\n')}` },
	})
	expect(clearOBSResponse).toHaveBeenCalledWith(obs, 5)
})

test.each([[[]], [[track('Single')]]])('explicitly reports no eligible artists for history %j', async (track_log) => {
	getArtistPlayHistory.mockResolvedValue([{ track_log }])
	await run()
	const message = "No artists have been played at least twice in @TestDJ's streams over the past 30 days."
	expect(client.say).toHaveBeenCalledWith('#testdj', message)
	expect(obs.call).toHaveBeenCalledWith('SetInputSettings', {
		inputName: 'npchatbot-response', inputSettings: { text: message },
	})
})

test('merges current plays once and respects disabled OBS', async () => {
	const current = track('Daft Punk')
	setCurrentPlaylistSummary({ track_log: [current, track('Daft Punk', 1)] })
	getArtistPlayHistory.mockResolvedValue([{ track_log: [current, track('Single')] }])
	await run({ ...config, isObsResponseEnabled: false })
	expect(client.say).toHaveBeenCalledWith('#testdj',
		"The most played artist in @TestDJ's streams for the past 30 days is Daft Punk.")
	expect(obs.call).not.toHaveBeenCalled()
	expect(clearOBSResponse).not.toHaveBeenCalled()
})

test('allows an empty active playlist and keeps existing commands live-data gated', async () => {
	setCurrentPlaylistSummary({ track_log: [] })
	getArtistPlayHistory.mockResolvedValue(history(['Daft Punk']))
	await run()
	expect(client.say).toHaveBeenCalledWith('#testdj', expect.stringContaining('is Daft Punk.'))
	setCurrentPlaylistSummary(undefined)
	client.say.mockClear()
	getArtistPlayHistory.mockClear()
	await run(config, ['artist'])
	expect(client.say).toHaveBeenCalledWith('#testdj', NO_LIVE_DATA_MESSAGE)
	expect(getArtistPlayHistory).not.toHaveBeenCalled()
})

test('reports database errors instead of a successful empty result', async () => {
	getArtistPlayHistory.mockRejectedValue(new Error('Database unavailable'))
	await run()
	expect(client.say).toHaveBeenCalledTimes(1)
	expect(client.say).toHaveBeenCalledWith('#testdj', ERROR_MESSAGE)
	expect(obs.call).not.toHaveBeenCalled()
})

test('advertises !np artists in the fallback options', async () => {
	setCurrentPlaylistSummary({ track_log: [] })
	await run(config, ['unknown'])
	expect(client.say).toHaveBeenCalledWith('#testdj', expect.stringContaining('!np artists,'))
})
