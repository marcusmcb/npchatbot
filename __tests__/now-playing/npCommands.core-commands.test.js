const { EventEmitter } = require('events')

jest.mock('../../obs/obsHelpers/obsHelpers', () => jest.fn())

const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')
const {
	handleDefault,
	handlePrevious,
	handleStats,
	handleDoubles,
	handleShortest,
	handleLongest,
} = require('../../bot-assets/commands/now-playing/npCommands')

const makeMockTwitchClient = () => {
	const client = new EventEmitter()
	client.say = jest.fn()
	return client
}

const baseConfig = {
	isObsResponseEnabled: true,
	twitchChannelName: 'TestDJ',
}

const makeObsMock = () => ({
	call: jest.fn(),
})

const buildReportData = (overrides = {}) => ({
	track_log: [],
	total_tracks_played: 0,
	average_track_length: { minutes: 0, seconds: 0 },
	doubles_played: [],
	shortest_track: null,
	longest_track: null,
	...overrides,
})

describe('npCommands core command handlers', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('handleDefault (!np) uses full_track_id for current song', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const reportData = buildReportData({
			track_log: [
				{
					track_number: 1,
					track_id: 'Base Title',
					full_track_id: 'Base Title (Remix Info)',
					timestamp: new Date().toISOString(),
					length: '3:00',
					source: 'seeded',
				},
			],
		})

		handleDefault('#test', twitchClient, reportData, obs, 5, baseConfig)

		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/Now playing: Base Title \(Remix Info\)/)

		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})

	test('handlePrevious (!np previous) uses full_track_id for previous song', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const reportData = buildReportData({
			track_log: [
				{
					track_number: 1,
					track_id: 'Old Base',
					full_track_id: 'Old Base (Extra)',
					timestamp: new Date().toISOString(),
					length: '3:00',
					source: 'seeded',
				},
				{
					track_number: 2,
					track_id: 'Current Base',
					full_track_id: 'Current Base (Remix)',
					timestamp: new Date().toISOString(),
					length: '3:00',
					source: 'seeded',
				},
			],
		})

		handlePrevious('#test', twitchClient, reportData, obs, 5, baseConfig)

		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/Previous song: Old Base \(Extra\)/)

		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})

	test('handleStats (!np stats) reports total tracks and average length', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const reportData = buildReportData({
			total_tracks_played: 5,
			average_track_length: { minutes: 3, seconds: 7 },
		})

		handleStats('#test', twitchClient, reportData, obs, 5, baseConfig, {})

		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/has played 5 songs so far/)
		expect(message).toMatch(/average track length of 3:07/)

		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})

	test('handleShortest (!np shortest) reports shortest track and its length', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const reportData = buildReportData({
			shortest_track: {
				track_id: 'Short Song',
				length: '2:15',
				time_played: new Date().toISOString(),
			},
		})

		handleShortest('#test', twitchClient, reportData, obs, 5, baseConfig, {})

		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/Short Song/)
		expect(message).toMatch(/\(2:15\)/)

		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})

	test('handleLongest (!np longest) reports longest track and its length', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const reportData = buildReportData({
			longest_track: {
				track_id: 'Long Song',
				length: '10:00',
				time_played: new Date().toISOString(),
			},
		})

		handleLongest('#test', twitchClient, reportData, obs, 5, baseConfig, {})

		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/Long Song/)
		expect(message).toMatch(/\(10:00\)/)

		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})

	// For handleDoubles we focus on the shape of the response rather than
	// the exact formatted time text, since that is covered elsewhere.
	test('handleDoubles (!np doubles) reports count and most recent doubles track', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const now = new Date()
		const timePlayed = new Date(now.getTime() - 5 * 60 * 1000).toISOString()

		const reportData = buildReportData({
			track_log: [
				{
					track_number: 1,
					track_id: 'Song X',
					full_track_id: 'Song X (Remix)',
					timestamp: timePlayed,
					length: '3:30',
					source: 'live',
				},
			],
			doubles_played: [
				{
					track_id: 'Song X',
					time_played: timePlayed,
				},
			],
		})

		handleDoubles('#test', twitchClient, reportData, obs, 5, baseConfig, {})

		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/has played 1 set\(s\) of doubles/)
		expect(message).toMatch(/"Song X"/)

		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})
})
