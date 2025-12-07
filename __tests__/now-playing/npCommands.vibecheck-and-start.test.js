const { EventEmitter } = require('events')

jest.mock('../../obs/obsHelpers/obsHelpers', () => jest.fn())
jest.mock('../../bot-assets/command-use/commandUse', () => ({
	getCurrentPlaylistSummary: jest.fn(),
	npSongsQueried: [],
}))

const clearOBSResponse = require('../../obs/obsHelpers/obsHelpers')
const {	handleVibeCheck,
	handleStart,
} = require('../../bot-assets/commands/now-playing/npCommands')
const {	getCurrentPlaylistSummary,
} = require('../../bot-assets/command-use/commandUse')

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

const buildReportData = (trackLog) => ({
	track_log: trackLog,
})

const MINUTE = 60 * 1000

/**
 * Build a simple track log where timestamps are relative to a given
 * reference "now" time via an offset in minutes.
 */
const makeRelativeTrack = (name, minutesAgo, now, fullName) => ({
	track_number: 1,
	track_id: name,
	full_track_id: fullName,
	timestamp: new Date(now.getTime() - minutesAgo * MINUTE).toISOString(),
	length: '3:00',
	source: 'seeded',
})

describe('npCommands integration for vibecheck and start', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('handleVibeCheck reports roughly correct minutes-ago wording', () => {
		const now = new Date()
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		// Build a tiny tracklog with predictable offsets. Because
		// vibeCheckSelector picks a random element, we monkey-patch
		// Math.random below to always pick index 2 ("Track Recent").
		const trackLog = [
			makeRelativeTrack('Track Old', 30, now, 'Track Old (Extra Mix)'),
			makeRelativeTrack('Track Middle', 12, now, 'Track Middle (Alt Edit)'),
			makeRelativeTrack(
				'Track Recent',
				5,
				now,
				'Track Recent (Full Tilt Remix)'
			),
		]

		// Provide this track log to handleVibeCheck via reportData
		const reportData = buildReportData(trackLog)

		// We cannot control the random vibeCheckSelector without reaching into
		// the helper, so instead we temporarily monkey-patch Math.random to
		// always select index 2 ("Track Recent" = ~5 minutes ago).
		const originalRandom = Math.random
		Math.random = () => 0.9 // index 2 for a 3-length array

		try {
			handleVibeCheck(
				'#test',
				twitchClient,
				reportData,
				obs,
				5,
				baseConfig,
				{}
			)

			expect(twitchClient.say).toHaveBeenCalledTimes(1)
			const [channel, message] = twitchClient.say.mock.calls[0]
			expect(channel).toBe('#test')

			// Expect it to mention the selected full track name, including
			// the extra title detail from full_track_id.
			expect(message).toMatch(/Track Recent \(Full Tilt Remix\)/)
			// And to mention "minute" wording, approximating the 5-minute offset
			expect(message).toMatch(/minute/)
		} finally {
			Math.random = originalRandom
		}

		// OBS should be updated once
		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})

	test('handleStart reports the first (oldest) track in the log', () => {
		const obs = makeObsMock()
		const twitchClient = makeMockTwitchClient()

		const trackLog = [
			{
				track_number: 3,
				track_id: 'First Track',
				timestamp: new Date().toISOString(),
				length: '3:00',
				source: 'seeded',
			},
			{
				track_number: 2,
				track_id: 'Second Track',
				timestamp: new Date().toISOString(),
				length: '3:00',
				source: 'seeded',
			},
			{
				track_number: 1,
				track_id: 'Most Recent',
				timestamp: new Date().toISOString(),
				length: '3:00',
				source: 'seeded',
			},
		]

		const reportData = buildReportData(trackLog)

		handleStart(
			'#test',
			twitchClient,
			reportData,
			obs,
			5,
			baseConfig,
			{}
		)

		// Should reference "First Track", not the most recent track
		expect(twitchClient.say).toHaveBeenCalledTimes(1)
		const [channel, message] = twitchClient.say.mock.calls[0]
		expect(channel).toBe('#test')
		expect(message).toMatch(/First Track/)
		expect(message).not.toMatch(/Most Recent/)

		// OBS should be updated once
		expect(obs.call).toHaveBeenCalledTimes(1)
		expect(clearOBSResponse).toHaveBeenCalled()
	})
})
