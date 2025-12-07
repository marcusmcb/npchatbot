const { EventEmitter } = require('events')

jest.mock('../../obs/obsHelpers/obsHelpers', () => jest.fn())
jest.mock('../../bot-assets/command-use/commandUse', () => ({
	getCurrentPlaylistSummary: jest.fn(),
	dypSearchTerms: [],
}))

const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')
const { dypCommand } = require('../../bot-assets/commands/did-you-play/didYouPlay')
const { getCurrentPlaylistSummary } = require('../../bot-assets/command-use/commandUse')

const makeMockTwitchClient = () => {
	const client = new EventEmitter()
	client.say = jest.fn()
	return client
}

const makeObsMock = () => ({
	call: jest.fn(),
})

const baseConfig = {
	isObsResponseEnabled: true,
	twitchChannelName: 'TestDJ',
	obsClearDisplayTime: 5,
}

const MINUTE = 60 * 1000

const makeRelativeTrack = (name, fullName, minutesAgo, now) => ({
	track_number: 1,
	track_id: name,
	full_track_id: fullName,
	timestamp: new Date(now.getTime() - minutesAgo * MINUTE).toISOString(),
	length: '3:00',
	source: 'seeded',
})

const buildReportData = (trackLog) => ({
	track_log: trackLog,
	// Simulate that enough tracks have been played to allow searching,
	// without changing the production threshold logic in dypCommand.
	total_tracks_played: Math.max(trackLog.length, 4),
})

describe('dypCommand full title behaviour', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test("searches using full_track_id so remix text is matched", async () => {
		const now = new Date()
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const trackLog = [
			makeRelativeTrack('Song A', 'Song A (Intro Edit)', 45, now),
			makeRelativeTrack(
				'Artist A - Song Title',
				'Artist A - Song Title (Full Tilt Remix)',
				10,
				now
			),
		]

		getCurrentPlaylistSummary.mockReturnValue(buildReportData(trackLog))

		await dypCommand(
			'#test',
			{},
			['Full', 'Tilt', 'Remix'],
			twitchClient,
			obs,
			'http://example.com',
			baseConfig
		)

		// Should have sent one chat message including the full remix title
		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(
			/Artist A - Song Title \(Full Tilt Remix\)/
		)

		// OBS path should also include the full remix title
		expect(obs.call).toHaveBeenCalledTimes(1)
		const [method, payload] = obs.call.mock.calls[0]
		expect(method).toBe('SetInputSettings')
		expect(payload.inputSettings.text).toMatch(
			/Artist A - Song Title \(Full Tilt Remix\)/
		)

		expect(clearOBSResponse).toHaveBeenCalled()
	})
})
