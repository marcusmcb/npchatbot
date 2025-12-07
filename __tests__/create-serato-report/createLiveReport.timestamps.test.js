const createLiveReport = require('../../bot-assets/commands/create-serato-report/createLiveReport')

jest.mock('../../bot-assets/commands/create-serato-report/helpers/scrapeData', () =>
	jest.fn()
)

const scrapeData = require('../../bot-assets/commands/create-serato-report/helpers/scrapeData')

const MINUTE = 60 * 1000

// Helper to build a fake cheerio-like text node structure
const makeTextNode = (text) => ({
	children: [{ data: text }],
})

describe('createLiveReport timestamp anchoring', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('uses "X minutes ago" relative to now for track timestamps', async () => {
		// Fix "now" so this test is deterministic
		const fixedNow = new Date('2025-12-05T01:00:00.000Z')
		const originalDateNow = Date

		// Monkey-patch global Date constructor used inside createLiveReport
		// so "new Date()" within the module returns our fixedNow while still
		// allowing Date(...) as a function and new Date(value) usages.
		// eslint-disable-next-line no-global-assign
		Date = class extends Date {
			constructor(value) {
				if (value) {
					// @ts-ignore
					return super(value)
				}
				// @ts-ignore
				return new originalDateNow(fixedNow.getTime())
			}
			static now() {
				return fixedNow.getTime()
			}
		}

		try {
			// Fake Serato scrape: two tracks, 10 and 25 minutes ago.
			scrapeData.mockResolvedValueOnce([
				[
					{ children: [{ data: 'Track A' }] },
					{ children: [{ data: 'Track B' }] },
				],
				[
					makeTextNode('10 minutes ago'),
					makeTextNode('25 minutes ago'),
				],
				'8:00pm',
			])

			const report = await createLiveReport('https://example.com/playlist')

			expect(report).toBeDefined()
			expect(report.track_log).toHaveLength(2)

			const [first, second] = report.track_log

			// Timestamps should be fixedNow minus the offsets encoded in the
			// fake Serato "ago" text we supplied above.
			const playedAtFirst = new originalDateNow(first.timestamp)
			const playedAtSecond = new originalDateNow(second.timestamp)

			const diffFirstMs = fixedNow.getTime() - playedAtFirst.getTime()
			const diffSecondMs = fixedNow.getTime() - playedAtSecond.getTime()

			// Allow a small epsilon (~5 seconds) for any rounding behavior,
			// but the differences should be roughly 10 and 25 minutes.
			const epsilon = 5 * 1000

			expect(Math.abs(diffFirstMs - 10 * MINUTE)).toBeLessThanOrEqual(epsilon)
			expect(Math.abs(diffSecondMs - 25 * MINUTE)).toBeLessThanOrEqual(epsilon)

			// Track IDs should be wired through correctly from the scrape data.
			expect(first.track_id).toBe('Track A')
			expect(second.track_id).toBe('Track B')

			// Length for the most recent track should be "Still playing" as per
			// createLiveReport semantics, and the second should be a non-zero
			// minutes:seconds string derived from timestamp differences.
			expect(first.length).toBe('Still playing')
			expect(second.length).not.toBe('0:00')
		} finally {
			// Restore global Date
			// eslint-disable-next-line no-global-assign
			Date = originalDateNow
		}
	})

	test('supports composite "hours and minutes ago" strings', async () => {
		const fixedNow = new Date('2025-12-05T02:00:00.000Z')
		const originalDateNow = Date

		// eslint-disable-next-line no-global-assign
		Date = class extends Date {
			constructor(value) {
				if (value) {
					// @ts-ignore
					return super(value)
				}
				// @ts-ignore
				return new originalDateNow(fixedNow.getTime())
			}
			static now() {
				return fixedNow.getTime()
			}
		}

		try {
			// Fake Serato scrape: one track "1 hour 5 minutes ago".
			scrapeData.mockResolvedValueOnce([
				[
					{ children: [{ data: 'Composite Track' }] },
				],
				[
					makeTextNode('1 hour 5 minutes ago'),
				],
				'8:00pm',
			])

			const report = await createLiveReport('https://example.com/playlist')
			expect(report).toBeDefined()
			expect(report.track_log).toHaveLength(1)

			const [only] = report.track_log
			const playedAt = new originalDateNow(only.timestamp)
			const diffMs = fixedNow.getTime() - playedAt.getTime()
			const expectedMs = (1 * 60 + 5) * MINUTE
			const epsilon = 5 * 1000
			expect(Math.abs(diffMs - expectedMs)).toBeLessThanOrEqual(epsilon)
		} finally {
			// eslint-disable-next-line no-global-assign
			Date = originalDateNow
		}
	})
})
