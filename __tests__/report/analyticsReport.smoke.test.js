'use strict'

const cheerio = require('cheerio')
const buildPlaylistSummariesHtml = require('../../report-templates/buildPlaylistSummariesHtml')

describe('Browser analytics report smoke', () => {
	it('generates expected analytics UI structure', () => {
		const html = buildPlaylistSummariesHtml({
			playlistSummaries: [
				{
					_id: 'abc123',
					dj_name: 'DJ Test',
					playlist_date: '3/16/2025',
					session_date: '2025-03-16',
					set_start_time: '9:00 PM',
					total_tracks_played: 42,
					average_track_length_minutes: 3,
					average_track_length_seconds: 30,
					track_log: [],
					doubles_played: [],
					np_songs_queried: [],
					dyp_search_terms: [],
				},
			],
			currentReportIndex: 0,
			isDiscordAuthorized: false,
			twitchChannelName: 'testchannel',
			discordShareNonce: 'nonce',
		})

		expect(typeof html).toBe('string')
		expect(html).toContain("Content-Security-Policy")
		expect(html).toContain('connect-src http://127.0.0.1:5003')

		const $ = cheerio.load(html)

		// Tab row
		expect($('#topTabTopSongs').length).toBe(1)
		expect($('#topTabShortLong').length).toBe(1)
		expect($('#topTabDoubles').length).toBe(1)
		expect($('#topTabCommandUse').length).toBe(1)
		expect($('#topTabStats').length).toBe(1)
		expect($('#topTabSongsPlayed').length).toBe(1)
		expect($('#topTabSearchSongs').length).toBe(1)
		expect($('#topTabStats').text()).toContain('Song Length')
		expect($('#topTabSongsPlayed').text()).toContain('Songs Played')
		expect($('#topTabSearchSongs').text()).toContain('Search Songs')

		// Shared range controls
		expect($('#topSongsModeStreams').length).toBe(1)
		expect($('#topSongsStreamNumber').length).toBe(1)
		expect($('#topSongsStreamCount').length).toBe(1)
		expect($('#topSongsModeDates').length).toBe(1)
		expect($('#topSongsStartDate').length).toBe(1)
		expect($('#topSongsEndDate').length).toBe(1)
		expect($('#topSongsApplyBtn').length).toBe(1)

		// Quick-pick options read well
		const options = $('#topSongsStreamCount option')
		const optionTexts = options
			.map((i, el) => $(el).text())
			.get()
		expect(optionTexts[0]).toBe('streams')
		expect(optionTexts).toContain('5 streams')
		expect(optionTexts).toContain('10 streams')
		expect(optionTexts).toContain('50 streams')
		expect(optionTexts).toContain('all')

		// Song length chart + tooltip
		expect($('#statsPanel').length).toBe(1)
		expect($('#statsChart').length).toBe(1)
		expect($('#statsTooltip').length).toBe(1)

		// Songs played chart + tooltip
		expect($('#songsPlayedPanel').length).toBe(1)
		expect($('#songsPlayedChart').length).toBe(1)
		expect($('#songsPlayedTooltip').length).toBe(1)

		// Search songs panel + controls
		expect($('#searchSongsPanel').length).toBe(1)
		expect($('#searchSongsTerm').length).toBe(1)
		expect($('#searchSongsBtn').length).toBe(1)
		expect($('#searchSongsBtn').text()).toContain('Search')
		expect($('#searchSongsList').length).toBe(1)

		// The inline script should contain the expected tab id wiring
		const scriptText = $('script').last().text() || ''
		expect(scriptText).toContain('topTabSongsPlayed')
		expect(scriptText).toContain("setAnalyticsTab('songsPlayed')")
	})
})
