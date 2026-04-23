'use strict'

module.exports = ({
	playlistSummaries,
	currentReportIndex,
	isDiscordAuthorized,
	twitchChannelName,
	discordShareNonce,
}) => {
	const payload = {
		generatedAt: new Date().toISOString(),
		currentReportIndex,
		playlistSummaries,
		isDiscordAuthorized: isDiscordAuthorized === true,
		twitchChannelName:
			typeof twitchChannelName === 'string' ? twitchChannelName : '',
		discordShareNonce:
			typeof discordShareNonce === 'string' ? discordShareNonce : '',
	}

	const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString(
		'base64'
	)

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'unsafe-inline'; connect-src http://127.0.0.1:5003; base-uri 'none'; form-action 'none'" />
		<title>npChatbot Playlist Summaries</title>
		<style>
			/* Match npChatbot app theme (see client/src/App.css) */
			:root {
				--main-bg-color: rgb(49, 49, 49);
				--main-text-color: #fff;
				--highlight-color: rgb(74, 242, 228);
				--success-color: rgb(87, 255, 104);
				--session-info-label-color: rgb(240, 253, 155);
				--disabled-color: #aaa;
				--fira-sans: 'Fira Sans', sans-serif;
				--dm-sans: 'DM Sans', sans-serif;

				/* Aliases used by the layout below */
				--bg: var(--main-bg-color);
				--panel: var(--main-bg-color);
				--text: var(--main-text-color);
				--muted: var(--disabled-color);
				--accent: var(--highlight-color);
				--border: rgba(74, 242, 228, 0.35);
				--value: var(--session-info-label-color);
			}
			* { box-sizing: border-box; }
			body {
				margin: 0;
				font-family: var(--fira-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif;
				background: var(--bg);
				color: var(--text);
				line-height: 1.4;
			}
			.container {
				max-width: 1100px;
				margin: 0 auto;
				padding: 20px;
			}
			header {
				display: flex;
				justify-content: space-between;
				align-items: baseline;
				gap: 12px;
				margin-bottom: 12px;
			}
			.title {
				font-size: 18px;
				font-weight: 700;
				color: var(--highlight-color);
			}
			.subtitle {
				color: var(--text);
				opacity: 0.85;
				font-size: 12px;
				font-family: var(--dm-sans);
			}
			.subtitle:empty {
				display: none;
			}
			.controls {
				display: flex;
				gap: 8px;
				align-items: center;
				margin: 12px 0 16px;
			}
			.danger {
				border-color: #ff6b6b;
				color: #ff6b6b;
			}
			.danger:hover {
				border-color: #ff6b6b;
				color: #fff;
				background: #ff6b6b;
			}
			.modal-backdrop {
				position: fixed;
				inset: 0;
				background: rgba(0,0,0,0.6);
				display: none;
				align-items: center;
				justify-content: center;
				padding: 18px;
				z-index: 9999;
			}
			.modal {
				width: min(520px, 100%);
				background: var(--panel);
				border: 1px solid var(--border);
				border-radius: 12px;
				padding: 14px;
			}
			.modal h3 {
				margin: 0 0 10px;
				font-size: 16px;
				color: var(--accent);
				font-family: var(--fira-sans);
				font-weight: 700;
			}
			.modal p {
				margin: 0 0 14px;
				color: var(--text);
				opacity: 0.9;
				font-family: var(--dm-sans);
				font-size: 13px;
			}
			.modal-actions {
				display: flex;
				gap: 10px;
				justify-content: flex-end;
			}
			button, select {
				background: var(--panel);
				color: var(--text);
				border: 2px solid var(--accent);
				border-radius: 5px;
				padding: 8px 10px;
				font-size: 14px;
				font-family: var(--fira-sans);
			}
			button {
				cursor: pointer;
			}
			button:hover {
				background: var(--accent);
				color: #000;
			}
			button:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
			button:disabled:hover {
				background: var(--panel);
				color: var(--text);
			}
			select {
				flex: 1;
				cursor: pointer;
			}
			.icon-button {
				border: none !important;
				padding: 0 !important;
				margin: 0 0 0 10px !important;
				background: none !important;
				line-height: 0;
				display: inline-flex;
				align-items: center;
				justify-content: center;
			}
			.icon-button:hover {
				background: none !important;
			}
			.copy-status {
				margin-left: 10px;
				font-family: var(--dm-sans);
				font-size: 12px;
				color: var(--success-color);
			}
			.report {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 14px;
			}
			@media (max-width: 900px) {
				.report { grid-template-columns: 1fr; }
			}
			.panel {
				background: var(--panel);
				border: 1px solid var(--border);
				border-radius: 12px;
				padding: 14px;
			}
			.panel h2 {
				margin: 0 0 10px;
				font-size: 16px;
				color: var(--accent);
				font-family: var(--fira-sans);
				font-weight: 600;
			}
			.kv {
				display: grid;
				grid-template-columns: 180px 1fr;
				gap: 6px 12px;
				font-size: 13px;
				font-family: var(--fira-sans);
			}
			.k {
				color: var(--text);
			}
			.v {
				color: var(--value);
				font-family: var(--dm-sans);
			}
			.v a {
				color: var(--accent);
				text-decoration: none;
				font-family: var(--fira-sans);
			}
			.v a:hover {
				text-decoration: underline;
				color: var(--success-color);
			}
			#spotify {
				display: flex;
				align-items: flex-start;
				gap: 10px;
				flex-wrap: wrap;
			}
			#spotify .icon-button {
				margin-left: 0 !important;
			}
			#spotify .copy-status {
				margin-left: 0;
			}
			.badge {
				display: inline;
				padding: 0;
				border-radius: 0;
				border: none;
				color: var(--session-info-label-color);
				font-size: 16px;
				font-weight: 700;
				margin-left: 8px;
				font-family: var(--fira-sans);
			}
			.emptyHeader {
				margin: 0 0 10px;
				font-size: 16px;
				color: var(--accent);
				font-family: var(--fira-sans);
				font-weight: 600;
			}
			.cmd {
				color: var(--session-info-label-color);
				font-weight: 700;
			}
			.list {
				margin: 8px 0 0;
				padding-left: 18px;
				font-size: 13px;
				font-family: var(--dm-sans);
			}
			.empty {
				color: var(--text);
				opacity: 0.85;
				font-size: 13px;
				font-family: var(--dm-sans);
			}

			/* Top songs section */
			.top-section-tabs {
				display: flex;
				gap: 0;
				align-items: baseline;
				flex-wrap: wrap;
				margin: 0 0 14px;
				padding-bottom: 8px;
				border-bottom: 1px solid var(--border);
			}
			.top-section-tab {
				appearance: none;
				background: none;
				border: none;
				padding: 0 12px;
				margin: 0;
				font-size: 16px;
				font-family: var(--fira-sans);
				font-weight: 600;
				color: var(--text);
				opacity: 0.75;
				cursor: pointer;
			}
			.top-section-tab:first-child {
				padding-left: 0;
			}
			.top-section-tab:last-child {
				padding-right: 0;
			}
			.top-section-tab + .top-section-tab {
				border-left: 1px solid var(--border);
			}
			.top-section-tab:hover {
				opacity: 1;
				color: var(--accent);
			}
			.top-section-tab.active {
				opacity: 1;
				color: var(--accent);
			}
			.top-songs-controls {
				display: flex;
				gap: 10px;
				align-items: center;
				flex-wrap: wrap;
				margin: 0 0 14px;
			}
			.top-songs-controls .radio {
				display: inline-flex;
				align-items: center;
				gap: 6px;
				font-size: 13px;
				font-family: var(--dm-sans);
				opacity: 0.95;
			}
			.top-songs-controls .radio input {
				accent-color: var(--accent);
			}
			.top-songs-controls .sep {
				opacity: 0.75;
				font-size: 12px;
				font-family: var(--dm-sans);
			}
			.top-songs-controls .stream-count-input {
				background: var(--panel);
				color: var(--text);
				border: 2px solid var(--accent);
				border-radius: 5px;
				padding: 8px 10px;
				font-size: 14px;
				font-family: var(--fira-sans);
				width: 90px;
			}
			.top-songs-controls .stream-count-quick {
				flex: 0 0 auto;
				width: 110px;
			}
			input[type="date"] {
				background: var(--panel);
				color: var(--text);
				border: 2px solid var(--accent);
				border-radius: 5px;
				padding: 8px 10px;
				font-size: 14px;
				font-family: var(--fira-sans);
			}
			.top-songs-meta {
				margin-top: 10px;
				color: var(--text);
				opacity: 0.85;
				font-size: 12px;
				font-family: var(--dm-sans);
			}
			.top-songs-list {
				margin: 10px 0 0;
				padding-left: 18px;
				font-size: 13px;
				font-family: var(--dm-sans);
			}
			.top-songs-list li {
				display: flex;
				gap: 12px;
				justify-content: flex-start;
				align-items: flex-start;
				margin: 6px 0;
			}
			#searchSongsList li {
				display: block;
			}
			.search-songs-controls {
				margin-top: 10px;
				display: flex;
				flex-direction: column;
				gap: 8px;
				font-family: var(--fira-sans);
				font-size: 13px;
				color: var(--text);
			}
			.search-songs-row {
				display: flex;
				gap: 10px;
				align-items: center;
			}
			.search-songs-row input[type="text"] {
				flex: 1;
				min-width: 0;
				background: var(--panel);
				color: var(--text);
				border: 2px solid var(--accent);
				border-radius: 5px;
				padding: 8px 10px;
				font-size: 14px;
				font-family: var(--fira-sans);
			}
			.top-songs-name {
				flex: 1;
				min-width: 0;
				word-break: break-word;
			}
			.top-songs-count {
				white-space: nowrap;
				min-width: 72px;
				text-align: left;
				color: var(--session-info-label-color);
				font-family: var(--fira-sans);
				font-weight: 700;
			}

			.shortlong-grid {
				display: grid;
				grid-template-columns: max-content 1fr max-content 1fr;
				row-gap: 8px;
				column-gap: 2ch;
				margin-top: 10px;
				font-size: 13px;
				font-family: var(--dm-sans);
			}
			.shortlong-columns {
				display: grid;
				grid-template-columns: 1fr 1fr;
				column-gap: 24px;
			}
			@media (max-width: 700px) {
				.shortlong-columns {
					grid-template-columns: 1fr;
					row-gap: 12px;
				}
			}
			.shortlong-col {
				display: grid;
				grid-template-columns: max-content 1fr;
				row-gap: 8px;
				column-gap: 2ch;
				margin-top: 10px;
				font-size: 13px;
				font-family: var(--dm-sans);
			}
			.shortlong-col-header {
				margin-top: 0;
				margin-bottom: 2px;
				color: var(--accent);
				font-family: var(--fira-sans);
				font-weight: 600;
				font-size: 16px;
				opacity: 1;
			}
			.shortlong-header {
				margin-top: 0;
				margin-bottom: 2px;
				color: var(--accent);
				font-family: var(--fira-sans);
				font-weight: 600;
				font-size: 16px;
				opacity: 1;
			}
			.shortlong-len {
				white-space: nowrap;
				color: var(--session-info-label-color);
				font-family: var(--fira-sans);
				font-weight: 700;
			}
			.shortlong-name {
				min-width: 0;
				word-break: break-word;
			}
			.commanduse-subheader {
				margin-top: 12px;
				margin-bottom: 2px;
				color: var(--accent);
				font-family: var(--fira-sans);
				font-weight: 600;
				font-size: 14px;
				opacity: 1;
			}
			.commanduse-list {
				margin: 8px 0 0;
				padding-left: 18px;
				font-size: 13px;
				font-family: var(--dm-sans);
			}
			.commanduse-list li {
				margin: 6px 0;
				word-break: break-word;
			}
			.commanduse-value {
				color: var(--session-info-label-color);
				font-family: var(--fira-sans);
				font-weight: 700;
			}
			.commanduse-dupe {
				color: var(--session-info-label-color);
				font-family: var(--fira-sans);
				font-weight: 700;
				white-space: nowrap;
			}
			.shortlong-col-header .commanduse-times {
				color: var(--text);
			}
			.stats-chart {
				width: 100%;
				height: 220px;
				margin-top: 10px;
				overflow: visible;
			}
			.stats-axis {
				stroke: var(--border);
				stroke-width: 1;
			}
			.stats-line {
				fill: none;
				stroke: var(--accent);
				stroke-width: 2;
				opacity: 0.95;
			}
			.stats-point {
				fill: var(--session-info-label-color);
				stroke: rgba(0,0,0,0.35);
				stroke-width: 1;
				cursor: pointer;
			}
			.stats-point:hover {
				fill: var(--success-color);
			}
			.stats-tick {
				fill: var(--text);
				opacity: 0.85;
				font-size: 12px;
			}
			.stats-chart-wrap {
				position: relative;
			}
			.stats-tooltip {
				position: absolute;
				z-index: 5;
				pointer-events: none;
				background: var(--panel);
				border: 1px solid var(--border);
				border-radius: 10px;
				padding: 8px 10px;
				color: var(--text);
				font-size: 12px;
				max-width: 220px;
				box-shadow: 0 8px 24px rgba(0,0,0,0.35);
			}
			.stats-tooltip .stats-tooltip-date {
				color: var(--accent);
				font-weight: 600;
			}
			.stats-tooltip .stats-tooltip-avg {
				color: var(--session-info-label-color);
				margin-top: 3px;
			}

			footer {
				margin-top: 14px;
				color: var(--text);
				opacity: 0.75;
				font-size: 12px;
				font-family: var(--dm-sans);
			}
		</style>
	</head>
	<body>
		<div class="container">
			<header>
				<div>
					<div class="title">npChatbot Playlist Summaries</div>
					<div class="subtitle" id="sessionTitle"></div>
				</div>
				<div class="subtitle">Generated: <span id="generatedAt"></span></div>
			</header>

			<div class="controls">
				<button id="olderBtn" type="button">Older</button>
				<button id="newerBtn" type="button">Newer</button>
				<select id="sessionSelect" aria-label="Select a playlist summary"></select>
				<button id="deleteBtn" class="danger" type="button" title="Delete" aria-label="Delete selected playlist summary">✕</button>
			</div>

			<div id="emptyState" class="panel empty" style="display:none;"></div>

			<div id="report" class="report" style="display:none;">
				<div class="panel">
					<h2>
						Summary for <span id="summaryFor" style="color: var(--text);"></span>
					</h2>
					<div class="kv">
						<div class="k">Playlist date</div><div class="v" id="playlistDate"></div>
						<div class="k">Set start time</div><div class="v" id="setStartTime"></div>
						<div class="k">Set length</div><div class="v" id="setLength"></div>
						<div class="k">Total tracks played</div><div class="v" id="totalTracks"></div>
						<div class="k">Average track length</div><div class="v" id="avgTrack"></div>
						<div class="k">Spotify</div><div class="v" id="spotify"></div>
					</div>
				</div>

				<div class="panel">
					<h2 id="doublesHeader">Doubles detected <span class="badge" id="doublesCount"></span></h2>
					<div id="doublesEmpty" class="emptyHeader" style="display:none;"></div>
					<ul id="doublesList" class="list"></ul>

					<hr style="border:0;border-top:1px solid var(--border); margin: 14px 0;" />

					<h2 id="npHeader">Songs queried <span class="badge" id="npCount"></span></h2>
					<div id="npEmpty" class="emptyHeader" style="display:none;"></div>
					<ul id="npList" class="list"></ul>

					<hr style="border:0;border-top:1px solid var(--border); margin: 14px 0;" />

					<h2 id="dypHeader">Terms searched <span class="badge" id="dypCount"></span></h2>
					<div id="dypEmpty" class="emptyHeader" style="display:none;"></div>
					<ul id="dypList" class="list"></ul>
				</div>
			</div>

			<div id="topSongsSection" style="display:none; margin-top: 14px;">
				<div class="top-section-tabs" role="tablist" aria-label="Playlist analytics">
					<button id="topTabTopSongs" class="top-section-tab active" type="button" role="tab" aria-selected="true" aria-controls="topSongsPanel">Top Songs Played</button>
					<button id="topTabShortLong" class="top-section-tab" type="button" role="tab" aria-selected="false" aria-controls="shortLongPanel">Shortest / Longest</button>
					<button id="topTabDoubles" class="top-section-tab" type="button" role="tab" aria-selected="false" aria-controls="doublesPanel">Doubles Played</button>
					<button id="topTabCommandUse" class="top-section-tab" type="button" role="tab" aria-selected="false" aria-controls="commandUsePanel">Command Use</button>
					<button id="topTabStats" class="top-section-tab" type="button" role="tab" aria-selected="false" aria-controls="statsPanel">Song Length</button>
					<button id="topTabSongsPlayed" class="top-section-tab" type="button" role="tab" aria-selected="false" aria-controls="songsPlayedPanel">Songs Played</button>
					<button id="topTabSearchSongs" class="top-section-tab" type="button" role="tab" aria-selected="false" aria-controls="searchSongsPanel">Search Songs</button>
				</div>
				<div class="top-songs-controls">
					<label class="radio"><input id="topSongsModeStreams" type="radio" name="topSongsMode" value="streams" checked /> Last</label>
					<input id="topSongsStreamNumber" class="stream-count-input" type="number" min="1" max="500" step="1" value="" aria-label="Enter stream count" />
					<select id="topSongsStreamCount" class="stream-count-quick" aria-label="Quick stream range">
						<option value="">streams</option>
						<option value="5">5 streams</option>
						<option value="10" selected>10 streams</option>
						<option value="15">15 streams</option>
						<option value="20">20 streams</option>
						<option value="30">30 streams</option>
						<option value="40">40 streams</option>
						<option value="50">50 streams</option>
						<option value="all">all</option>
					</select>
					<span class="sep">|</span>
					<label class="radio"><input id="topSongsModeDates" type="radio" name="topSongsMode" value="dates" /> Date range</label>
					<input id="topSongsStartDate" type="date" aria-label="Start date" />
					<span class="sep">to</span>
					<input id="topSongsEndDate" type="date" aria-label="End date" />
					<button id="topSongsApplyBtn" type="button">Apply</button>
				</div>
				<div id="topSongsPanel" class="panel">
					<div class="shortlong-header">Top Songs Played</div>
					<div id="topSongsEmpty" class="empty" style="display:none;"></div>
					<ol id="topSongsList" class="top-songs-list"></ol>
					<div id="topSongsMeta" class="top-songs-meta"></div>
				</div>
				<div id="shortLongPanel" class="panel" style="display:none;">
					<div class="shortlong-columns" aria-hidden="true">
						<div class="shortlong-col-header">Longest Songs</div>
						<div class="shortlong-col-header">Shortest Songs</div>
					</div>
					<div id="shortLongEmpty" class="empty" style="display:none;"></div>
					<div class="shortlong-columns">
						<div id="longestGrid" class="shortlong-col"></div>
						<div id="shortestGrid" class="shortlong-col"></div>
					</div>
					<div id="shortLongMeta" class="top-songs-meta"></div>
				</div>
				<div id="doublesPanel" class="panel" style="display:none;">
					<div class="shortlong-header">Doubles Played</div>
					<div id="doublesPanelEmpty" class="empty" style="display:none;"></div>
					<ol id="doublesPanelList" class="top-songs-list"></ol>
					<div id="doublesPanelMeta" class="top-songs-meta"></div>
				</div>
				<div id="commandUsePanel" class="panel" style="display:none;">
					<div class="shortlong-columns" aria-hidden="true">
						<div class="shortlong-col-header">np Commands Used: <span id="cmdNpCount" class="commanduse-value">0</span><span class="commanduse-times"> times</span></div>
						<div class="shortlong-col-header">Terms Searched: <span id="cmdDypCount" class="commanduse-value">0</span><span class="commanduse-times"> times</span></div>
					</div>
					<div id="commandUseEmpty" class="empty" style="display:none;"></div>
					<div class="shortlong-columns">
						<div>
							<div class="commanduse-subheader">Songs Identified</div>
							<ul id="cmdNpList" class="commanduse-list"></ul>
						</div>
						<div>
							<div class="commanduse-subheader">Terms Searched:</div>
							<ol id="cmdDypList" class="commanduse-list"></ol>
						</div>
					</div>
					<div id="commandUseMeta" class="top-songs-meta"></div>
				</div>
				<div id="statsPanel" class="panel" style="display:none;">
					<div class="shortlong-header">Average Song Length</div>
					<div id="statsEmpty" class="empty" style="display:none;"></div>
					<div class="stats-chart-wrap">
						<svg id="statsChart" class="stats-chart" viewBox="0 0 1000 220" role="img" aria-label="Average song length over time"></svg>
						<div id="statsTooltip" class="stats-tooltip" style="display:none;"></div>
					</div>
					<div id="statsMeta" class="top-songs-meta"></div>
				</div>
				<div id="songsPlayedPanel" class="panel" style="display:none;">
					<div class="shortlong-header">Songs Played</div>
					<div id="songsPlayedEmpty" class="empty" style="display:none;"></div>
					<div class="stats-chart-wrap">
						<svg id="songsPlayedChart" class="stats-chart" viewBox="0 0 1000 220" role="img" aria-label="Total songs played over time"></svg>
						<div id="songsPlayedTooltip" class="stats-tooltip" style="display:none;"></div>
					</div>
					<div id="songsPlayedMeta" class="top-songs-meta"></div>
				</div>
				<div id="searchSongsPanel" class="panel" style="display:none;">
					<div class="shortlong-header">Search Songs</div>
					<div class="search-songs-controls">
						<label for="searchSongsTerm">Search past streams by artist or title</label>
						<div class="search-songs-row">
							<input id="searchSongsTerm" type="text" aria-label="Search past streams by artist or title" />
							<button id="searchSongsBtn" type="button">Search</button>
						</div>
					</div>
					<div id="searchSongsEmpty" class="empty" style="display:none;"></div>
					<ol id="searchSongsList" class="top-songs-list"></ol>
				</div>
			</div>

			<footer>
				This page is generated locally by npChatbot. It contains your playlist summary data and is stored on your machine.
			</footer>
		</div>

		<div id="deleteModal" class="modal-backdrop" aria-hidden="true">
			<div class="modal" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
				<h3 id="deleteModalTitle">Delete playlist summary?</h3>
				<p id="deleteModalBody">This will permanently delete the selected playlist summary.</p>
				<div class="modal-actions">
					<button id="deleteCancelBtn" type="button">Cancel</button>
					<button id="deleteConfirmBtn" class="danger" type="button">Delete</button>
				</div>
			</div>
		</div>

		<script>
			(() => {
				const payloadB64 = ${JSON.stringify(payloadB64)};

				const $ = (id) => document.getElementById(id);
				const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

				const decodePayload = (b64) => {
					try {
						// Node encodes the JSON as UTF-8 bytes, then base64.
						// Decode base64 -> bytes -> UTF-8 to correctly handle non-ASCII characters.
						const bin = atob(b64);
						const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
						const json = new TextDecoder('utf-8').decode(bytes);
						return JSON.parse(json);
					} catch (e) {
						return { playlistSummaries: [], currentReportIndex: 0, generatedAt: '' };
					}
				};

				const safeArray = (v) => (Array.isArray(v) ? v : []);

				const uniqueCounts = (arr) => {
					const counts = new Map();
					for (const item of safeArray(arr)) {
						const name = item && typeof item.name === 'string' ? item.name : '';
						if (!name) continue;
						counts.set(name, (counts.get(name) || 0) + 1);
					}
					return Array.from(counts.entries())
						.map(([name, count]) => ({ name, count }))
						.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
				};

				const formatSetLength = (report) => {
					if (!report) return '—';
					const h = Number(report.set_length_hours || 0);
					const m = Number(report.set_length_minutes || 0);
					const parts = [];
					if (h > 0) parts.push(h + ' hour' + (h === 1 ? '' : 's'));
					if (m > 0) parts.push(m + ' minute' + (m === 1 ? '' : 's'));
					return parts.length ? parts.join(', ') : '0 seconds';
				};

				const clearList = (ul) => {
					while (ul.firstChild) ul.removeChild(ul.firstChild);
				};

				const addListItem = (ul, text) => {
					const li = document.createElement('li');
					li.textContent = text;
					ul.appendChild(li);
				};

				const copyToClipboard = async (text) => {
					try {
						if (navigator.clipboard && window.isSecureContext) {
							await navigator.clipboard.writeText(text);
							return true;
						}
					} catch {}

					try {
						const ta = document.createElement('textarea');
						ta.value = text;
						ta.setAttribute('readonly', '');
						ta.style.position = 'fixed';
						ta.style.left = '-9999px';
						ta.style.top = '0';
						document.body.appendChild(ta);
						ta.select();
						const ok = document.execCommand('copy');
						document.body.removeChild(ta);
						return ok;
					} catch {
						return false;
					}
				};

				const payload = decodePayload(payloadB64);
				const summaries = safeArray(payload.playlistSummaries);
				const isDiscordAuthorized = payload && payload.isDiscordAuthorized === true;
				const twitchChannelName = payload && typeof payload.twitchChannelName === 'string'
					? payload.twitchChannelName
					: '';
				const discordShareNonce = payload && typeof payload.discordShareNonce === 'string'
					? payload.discordShareNonce
					: '';
				let index = clamp(Number(payload.currentReportIndex) || 0, 0, Math.max(0, summaries.length - 1));

				const generatedAtRaw = payload.generatedAt || '';
				let generatedAtText = generatedAtRaw;
				if (generatedAtRaw) {
					const d = new Date(generatedAtRaw);
					if (!Number.isNaN(d.getTime())) {
						generatedAtText = d.toLocaleString(undefined, {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit',
						});
					}
				}
				$('generatedAt').textContent = generatedAtText;

				const olderBtn = $('olderBtn');
				const newerBtn = $('newerBtn');
				const sessionSelect = $('sessionSelect');
				const deleteBtn = $('deleteBtn');

				const deleteModal = $('deleteModal');
				const deleteCancelBtn = $('deleteCancelBtn');
				const deleteConfirmBtn = $('deleteConfirmBtn');

				// Top songs UI
				const topSongsSection = $('topSongsSection');
				const topTabTopSongs = $('topTabTopSongs');
				const topTabShortLong = $('topTabShortLong');
				const topTabDoubles = $('topTabDoubles');
				const topTabCommandUse = $('topTabCommandUse');
				const topTabStats = $('topTabStats');
				const topTabSongsPlayed = $('topTabSongsPlayed');
				const topTabSearchSongs = $('topTabSearchSongs');
				const topSongsPanel = $('topSongsPanel');
				const shortLongPanel = $('shortLongPanel');
				const doublesPanel = $('doublesPanel');
				const commandUsePanel = $('commandUsePanel');
				const statsPanel = $('statsPanel');
				const songsPlayedPanel = $('songsPlayedPanel');
				const searchSongsPanel = $('searchSongsPanel');
				const topSongsModeStreams = $('topSongsModeStreams');
				const topSongsModeDates = $('topSongsModeDates');
				const topSongsStreamCount = $('topSongsStreamCount');
				const topSongsStreamNumber = $('topSongsStreamNumber');
				const topSongsStartDate = $('topSongsStartDate');
				const topSongsEndDate = $('topSongsEndDate');
				const topSongsApplyBtn = $('topSongsApplyBtn');
				const topSongsMeta = $('topSongsMeta');
				const topSongsEmpty = $('topSongsEmpty');
				const topSongsList = $('topSongsList');
				const shortLongMeta = $('shortLongMeta');
				const shortLongEmpty = $('shortLongEmpty');
				const longestGrid = $('longestGrid');
				const shortestGrid = $('shortestGrid');
				const doublesMeta = $('doublesPanelMeta');
				const doublesEmpty = $('doublesPanelEmpty');
				const doublesList = $('doublesPanelList');
				const commandUseMeta = $('commandUseMeta');
				const commandUseEmpty = $('commandUseEmpty');
				const cmdNpCount = $('cmdNpCount');
				const cmdDypCount = $('cmdDypCount');
				const cmdNpList = $('cmdNpList');
				const cmdDypList = $('cmdDypList');
				const statsMeta = $('statsMeta');
				const statsEmpty = $('statsEmpty');
				const statsChart = $('statsChart');
				const statsTooltip = $('statsTooltip');
				const songsPlayedMeta = $('songsPlayedMeta');
				const songsPlayedEmpty = $('songsPlayedEmpty');
				const songsPlayedChart = $('songsPlayedChart');
				const songsPlayedTooltip = $('songsPlayedTooltip');
				const searchSongsTerm = $('searchSongsTerm');
				const searchSongsBtn = $('searchSongsBtn');
				const searchSongsEmpty = $('searchSongsEmpty');
				const searchSongsList = $('searchSongsList');

				let pendingDeleteId = '';
				let isSelectingFromChart = false;
				let searchSongsHasSearched = false;

				const selectSummaryIndex = (nextIndex) => {
					if (!Number.isFinite(nextIndex)) return;
					index = clamp(Number(nextIndex), 0, summaries.length - 1);
					syncSelect();
					// Avoid accidental recursion when a click triggers renderAnalytics -> chart -> click
					isSelectingFromChart = true;
					try {
						render();
					} finally {
						isSelectingFromChart = false;
					}
				};

				const openDeleteModal = (playlistId) => {
					pendingDeleteId = typeof playlistId === 'string' ? playlistId : '';
					if (!pendingDeleteId) return;
					deleteModal.style.display = 'flex';
					deleteModal.setAttribute('aria-hidden', 'false');
					deleteConfirmBtn.focus();
				};

				const closeDeleteModal = () => {
					pendingDeleteId = '';
					deleteModal.style.display = 'none';
					deleteModal.setAttribute('aria-hidden', 'true');
				};

				const clearChildren = (el) => {
					if (!el) return;
					while (el.firstChild) el.removeChild(el.firstChild);
				};

				const getSummaryTimestampMs = (summary) => {
					const iso =
						(summary && typeof summary.set_start_iso === 'string' && summary.set_start_iso) ||
						(summary && typeof summary.session_date === 'string' && summary.session_date) ||
						'';
					if (iso) {
						const d = new Date(iso);
						const t = d.getTime();
						if (Number.isFinite(t)) return t;
					}

					// Fallback: many summaries store only a human playlist_date like "3/27/2026" or "3/27/26".
					const rawDate = summary && typeof summary.playlist_date === 'string' ? summary.playlist_date.trim() : '';
					if (!rawDate) return null;
					const m = rawDate.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2}|\\d{4})$/);
					if (!m) return null;
					const month = Number(m[1]);
					const day = Number(m[2]);
					let year = Number(m[3]);
					if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
					if (year < 100) year = 2000 + year;
					const d = new Date(year, month - 1, day, 12, 0, 0, 0);
					const t = d.getTime();
					return Number.isFinite(t) ? t : null;
				};

				const parseDateInput = (value, endOfDay) => {
					if (!value || typeof value !== 'string') return null;
					const parts = value.split('-');
					if (parts.length !== 3) return null;
					const y = Number(parts[0]);
					const m = Number(parts[1]);
					const d = Number(parts[2]);
					if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
					const dt = endOfDay
						? new Date(y, m - 1, d, 23, 59, 59, 999)
						: new Date(y, m - 1, d, 0, 0, 0, 0);
					return Number.isNaN(dt.getTime()) ? null : dt;
				};

				const MONTH_NAMES = [
					'January',
					'February',
					'March',
					'April',
					'May',
					'June',
					'July',
					'August',
					'September',
					'October',
					'November',
					'December',
				];

				const ordinalSuffix = (n) => {
					const num = Math.abs(Number(n) || 0);
					const mod100 = num % 100;
					if (mod100 >= 11 && mod100 <= 13) return 'th';
					const mod10 = num % 10;
					if (mod10 === 1) return 'st';
					if (mod10 === 2) return 'nd';
					if (mod10 === 3) return 'rd';
					return 'th';
				};

				const ymdKey = (d) => {
					if (!(d instanceof Date)) return '';
					const t = d.getTime();
					if (!Number.isFinite(t)) return '';
					return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
				};

				const formatHumanDate = (d, includeYear) => {
					if (!(d instanceof Date)) return 'Any';
					const t = d.getTime();
					if (!Number.isFinite(t)) return 'Any';
					const monthName = MONTH_NAMES[d.getMonth()] || '';
					const day = d.getDate();
					const base = monthName + ' ' + String(day) + ordinalSuffix(day);
					return includeYear ? (base + ', ' + String(d.getFullYear())) : base;
				};

				const formatHumanRange = (start, end) => {
					const startOk = start instanceof Date && Number.isFinite(start.getTime());
					const endOk = end instanceof Date && Number.isFinite(end.getTime());
					if (!startOk && !endOk) return '';
					if (startOk && endOk) {
						const includeYear = start.getFullYear() !== end.getFullYear();
						if (ymdKey(start) === ymdKey(end)) return formatHumanDate(start, includeYear);
						return formatHumanDate(start, includeYear) + ' to ' + formatHumanDate(end, includeYear);
					}
					if (startOk) return formatHumanDate(start, false) + ' to Any';
					return 'Any to ' + formatHumanDate(end, false);
				};

				const computeTopSongs = (subsetSummaries, limit) => {
					const counts = new Map();
					for (const s of safeArray(subsetSummaries)) {
						const log = safeArray(s && s.track_log);
						for (const entry of log) {
							const raw = entry && (entry.full_track_id || entry.track_id);
							const name = typeof raw === 'string' ? raw.trim() : '';
							if (!name) continue;
							counts.set(name, (counts.get(name) || 0) + 1);
						}
					}

					return Array.from(counts.entries())
						.map(([name, count]) => ({ name, count }))
						.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
						.slice(0, Math.max(0, Number(limit) || 10));
				};

				const normalizeSearchTerm = (value) => {
					if (typeof value !== 'string') return '';
					return value.trim().toLowerCase();
				};

				const computeSearchSongs = (subsetSummaries, term) => {
					const q = normalizeSearchTerm(term);
					if (!q) return [];
					const counts = new Map();
					for (const s of safeArray(subsetSummaries)) {
						const log = safeArray(s && s.track_log);
						for (const entry of log) {
							const raw = entry && (entry.full_track_id || entry.track_id);
							const name = typeof raw === 'string' ? raw.trim() : '';
							if (!name) continue;
							if (name.toLowerCase().indexOf(q) === -1) continue;
							counts.set(name, (counts.get(name) || 0) + 1);
						}
					}

					return Array.from(counts.entries())
						.map(([name, count]) => ({ name, count }))
						.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
				};

				const parseLengthMs = (value) => {
					if (typeof value !== 'string') return null;
					const trimmed = value.trim();
					if (!trimmed || trimmed === 'Still playing' || trimmed === 'N/A') return null;
					const parts = trimmed.split(':').map((p) => Number(p));
					if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
					if (parts.length === 2) {
						const m = parts[0];
						const s = parts[1];
						return (m * 60 + s) * 1000;
					}
					if (parts.length === 3) {
						const h = parts[0];
						const m = parts[1];
						const s = parts[2];
						return (h * 3600 + m * 60 + s) * 1000;
					}
					return null;
				};

				const formatMsToClock = (ms) => {
					if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return '0:00';
					const totalSeconds = Math.floor(ms / 1000);
					const hours = Math.floor(totalSeconds / 3600);
					const minutes = Math.floor((totalSeconds % 3600) / 60);
					const seconds = totalSeconds % 60;
					if (hours > 0) {
						return String(hours) + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
					}
					return String(minutes) + ':' + String(seconds).padStart(2, '0');
				};

				const getAnalyticsSubsetAndMeta = () => {
					const mode = (topSongsModeDates && topSongsModeDates.checked) ? 'dates' : 'streams';
					let subset = [];
					let meta = '';
					if (mode === 'dates') {
						const start = parseDateInput(topSongsStartDate && topSongsStartDate.value, false);
						const end = parseDateInput(topSongsEndDate && topSongsEndDate.value, true);
						subset = summaries.filter((s) => {
							const t = getSummaryTimestampMs(s);
							if (t == null) return false;
							if (start && t < start.getTime()) return false;
							if (end && t > end.getTime()) return false;
							return true;
						});

						const rangeLabel = formatHumanRange(start, end) || 'Any';
						meta = 'Range: ' + rangeLabel + ' (' + subset.length + ' stream' + (subset.length === 1 ? '' : 's') + ')';
					} else {
						const rawQuick = topSongsStreamCount && typeof topSongsStreamCount.value === 'string'
							? topSongsStreamCount.value
							: '';
						const isAll = rawQuick === 'all';
						const rawN = topSongsStreamNumber && typeof topSongsStreamNumber.value === 'string'
							? topSongsStreamNumber.value
							: '';
						const n = isAll ? null : Math.max(1, Math.min(500, Number(rawN) || 10));
						subset = isAll ? summaries.slice() : summaries.slice(0, n);

						const times = subset
							.map(getSummaryTimestampMs)
							.filter((t) => typeof t === 'number' && Number.isFinite(t));
						if (times.length) {
							const min = new Date(Math.min(...times));
							const max = new Date(Math.max(...times));
							const humanRange = formatHumanRange(min, max);
							meta = isAll
								? 'Range: all streams' + (humanRange ? ' (' + humanRange + ')' : '')
								: 'Range: last ' + n + ' streams' + (humanRange ? ' (' + humanRange + ')' : '');
						} else {
							meta = isAll ? 'Range: all streams' : 'Range: last ' + n + ' streams';
						}
					}
					return { subset, meta };
				};

				const renderTopSongsWith = (subset, meta) => {
					if (topSongsEmpty) {
						topSongsEmpty.style.display = 'none';
						topSongsEmpty.textContent = '';
					}
					if (topSongsMeta) topSongsMeta.textContent = meta;
					clearChildren(topSongsList);

					const top = computeTopSongs(subset, 10);
					if (!top.length) {
						if (topSongsEmpty) {
							topSongsEmpty.style.display = 'block';
							topSongsEmpty.textContent = 'No song history was found for this range.';
						}
						return;
					}

					for (const item of top) {
						const li = document.createElement('li');
						const count = document.createElement('span');
						count.className = 'top-songs-count';
						count.textContent = String(item.count) + ' play' + (item.count === 1 ? '' : 's');
						const name = document.createElement('span');
						name.className = 'top-songs-name';
						name.textContent = item.name;
						li.appendChild(count);
						li.appendChild(name);
						topSongsList.appendChild(li);
					}
				};

				const renderSearchSongsWith = (subset) => {
					if (searchSongsEmpty) {
						searchSongsEmpty.style.display = 'none';
						searchSongsEmpty.textContent = '';
					}
					clearChildren(searchSongsList);
					const term = searchSongsTerm && typeof searchSongsTerm.value === 'string' ? searchSongsTerm.value : '';
					const q = normalizeSearchTerm(term);
					if (!q) {
						if (searchSongsHasSearched && searchSongsEmpty) {
							searchSongsEmpty.style.display = 'block';
							searchSongsEmpty.textContent = 'Enter a search term to see results.';
						}
						return;
					}

					const results = computeSearchSongs(subset, q);
					if (!results.length) {
						if (searchSongsEmpty) {
							searchSongsEmpty.style.display = 'block';
							searchSongsEmpty.textContent = 'No songs matched "' + term.trim() + '".';
						}
						return;
					}

					for (const item of results) {
						const li = document.createElement('li');
						li.appendChild(document.createTextNode(item.name));
						if (item.count > 1) {
							const dupe = document.createElement('span');
							dupe.className = 'commanduse-dupe';
							dupe.textContent = ' (' + String(item.count) + 'x)';
							li.appendChild(dupe);
						}
						searchSongsList.appendChild(li);
					}
				};

				const computeShortestLongest = (subsetSummaries, limit) => {
					const longestBySong = new Map();
					const shortestBySong = new Map();
					for (const s of safeArray(subsetSummaries)) {
						const log = safeArray(s && s.track_log);
						for (const entry of log) {
							const rawName = entry && (entry.full_track_id || entry.track_id);
							const name = typeof rawName === 'string' ? rawName.trim() : '';
							if (!name) continue;
							const ms = parseLengthMs(entry && entry.length);
							if (ms == null || ms <= 0) continue;

							const existingLong = longestBySong.get(name);
							if (existingLong == null || ms > existingLong) longestBySong.set(name, ms);

							const existingShort = shortestBySong.get(name);
							if (existingShort == null || ms < existingShort) shortestBySong.set(name, ms);
						}
					}

					const longest = Array.from(longestBySong.entries())
						.map(([name, ms]) => ({ name, ms }))
						.sort((a, b) => b.ms - a.ms || a.name.localeCompare(b.name))
						.slice(0, Math.max(0, Number(limit) || 10));
					const shortest = Array.from(shortestBySong.entries())
						.map(([name, ms]) => ({ name, ms }))
						.sort((a, b) => a.ms - b.ms || a.name.localeCompare(b.name))
						.slice(0, Math.max(0, Number(limit) || 10));

					return { longest, shortest };
				};

				const renderShortestLongestWith = (subset, meta) => {
					if (shortLongEmpty) {
						shortLongEmpty.style.display = 'none';
						shortLongEmpty.textContent = '';
					}
					if (shortLongMeta) shortLongMeta.textContent = meta;
					clearChildren(longestGrid);
					clearChildren(shortestGrid);

					const { longest, shortest } = computeShortestLongest(subset, 10);
					if (!longest.length && !shortest.length) {
						if (shortLongEmpty) {
							shortLongEmpty.style.display = 'block';
							shortLongEmpty.textContent = 'No song lengths were found for this range.';
						}
						return;
					}

					for (const long of longest) {
						const longLen = document.createElement('div');
						longLen.className = 'shortlong-len';
						longLen.textContent = formatMsToClock(long.ms);

						const longName = document.createElement('div');
						longName.className = 'shortlong-name';
						longName.textContent = long.name;

						longestGrid.appendChild(longLen);
						longestGrid.appendChild(longName);
					}

					for (const short of shortest) {
						const shortLen = document.createElement('div');
						shortLen.className = 'shortlong-len';
						shortLen.textContent = formatMsToClock(short.ms);

						const shortName = document.createElement('div');
						shortName.className = 'shortlong-name';
						shortName.textContent = short.name;

						shortestGrid.appendChild(shortLen);
						shortestGrid.appendChild(shortName);
					}
				};

				const computeDoublesInstances = (subsetSummaries, limit) => {
					const instances = [];
					for (const s of safeArray(subsetSummaries)) {
						const summaryT = getSummaryTimestampMs(s);
						const doubles = safeArray(s && s.doubles_played);
						const log = safeArray(s && s.track_log);
						for (let i = 0; i < doubles.length; i++) {
							const d = doubles[i];
							const fallbackTitle = d && typeof d.track_id === 'string' ? d.track_id.trim() : '';
							const playedAtRaw = d && typeof d.time_played === 'string' ? d.time_played : '';
							let playedAtMs = null;
							if (playedAtRaw) {
								const dt = new Date(playedAtRaw);
								const tt = dt.getTime();
								if (Number.isFinite(tt)) playedAtMs = tt;
							}

							let title = fallbackTitle;
							if (playedAtRaw && log.length) {
								const matchingTrack = log.find((entry) => entry && entry.timestamp === playedAtRaw);
								if (matchingTrack) {
									const candidate = matchingTrack.full_track_id || matchingTrack.track_id;
									if (typeof candidate === 'string' && candidate.trim()) title = candidate.trim();
								}
							}

							if (!title) continue;
							const t = playedAtMs != null ? playedAtMs : (summaryT != null ? summaryT : 0);
							instances.push({ t, i, title });
						}
					}

					instances.sort((a, b) => b.t - a.t || b.i - a.i || a.title.localeCompare(b.title));
					return instances.slice(0, Math.max(0, Number(limit) || 10));
				};

				const renderDoublesWith = (subset, meta) => {
					if (doublesEmpty) {
						doublesEmpty.style.display = 'none';
						doublesEmpty.textContent = '';
					}
					if (doublesMeta) doublesMeta.textContent = meta;
					clearChildren(doublesList);

					const items = computeDoublesInstances(subset, 10);
					if (!items.length) {
						if (doublesEmpty) {
							doublesEmpty.style.display = 'block';
							doublesEmpty.textContent = 'No doubles were found for this range.';
						}
						return;
					}

					for (const item of items) {
						const li = document.createElement('li');
						li.textContent = item.title;
						doublesList.appendChild(li);
					}
				};

				const flattenCommandUse = (subsetSummaries) => {
					const ordered = safeArray(subsetSummaries)
						.slice()
						.sort((a, b) => {
							const ta = getSummaryTimestampMs(a);
							const tb = getSummaryTimestampMs(b);
							return (ta == null ? 0 : ta) - (tb == null ? 0 : tb);
						});

					const np = [];
					const dyp = [];
					for (const s of ordered) {
						for (const item of safeArray(s && s.np_songs_queried)) {
							const name = item && typeof item.name === 'string' ? item.name.trim() : '';
							if (name) np.push(name);
						}
						for (const item of safeArray(s && s.dyp_search_terms)) {
							const name = item && typeof item.name === 'string' ? item.name.trim() : '';
							if (name) dyp.push(name);
						}
					}
					return { np, dyp };
				};

				const uniqueWithRecency = (names) => {
					const arr = safeArray(names);
					const counts = new Map();
					const lastIndex = new Map();
					for (let i = 0; i < arr.length; i++) {
						const name = arr[i];
						if (typeof name !== 'string' || !name) continue;
						counts.set(name, (counts.get(name) || 0) + 1);
						lastIndex.set(name, i);
					}
					return Array.from(counts.entries())
						.map(([name, count]) => ({ name, count, last: lastIndex.get(name) || 0 }))
						.sort((a, b) => b.last - a.last || b.count - a.count || a.name.localeCompare(b.name));
				};

				const uniqueMostIdentified = (names) => {
					const arr = safeArray(names);
					const counts = new Map();
					const lastIndex = new Map();
					for (let i = 0; i < arr.length; i++) {
						const name = arr[i];
						if (typeof name !== 'string' || !name) continue;
						counts.set(name, (counts.get(name) || 0) + 1);
						lastIndex.set(name, i);
					}
					return Array.from(counts.entries())
						.map(([name, count]) => ({ name, count, last: lastIndex.get(name) || 0 }))
						.sort((a, b) => b.count - a.count || b.last - a.last || a.name.localeCompare(b.name));
				};

				const renderCommandUseWith = (subset, meta) => {
					if (!cmdNpList || !cmdDypList) return;
					if (commandUseEmpty) {
						commandUseEmpty.style.display = 'none';
						commandUseEmpty.textContent = '';
					}
					if (commandUseMeta) commandUseMeta.textContent = meta;
					clearChildren(cmdNpList);
					clearChildren(cmdDypList);

					const flat = flattenCommandUse(subset);
					const npTotal = flat.np.length;
					const dypTotal = flat.dyp.length;
					if (cmdNpCount) cmdNpCount.textContent = String(npTotal);
					if (cmdDypCount) cmdDypCount.textContent = String(dypTotal);

					const songs = uniqueMostIdentified(flat.np).slice(0, 10);
					const terms = uniqueMostIdentified(flat.dyp).slice(0, 10);

					if (!songs.length && !terms.length) {
						if (commandUseEmpty) {
							commandUseEmpty.style.display = 'block';
							commandUseEmpty.textContent = 'No command usage was recorded for this range.';
						}
						return;
					}

					for (const s of songs) {
						const li = document.createElement('li');
						li.appendChild(document.createTextNode(s.name));
						if (s.count > 1) {
							const dupe = document.createElement('span');
							dupe.className = 'commanduse-dupe';
							dupe.textContent = ' (' + String(s.count) + 'x)';
							li.appendChild(dupe);
						}
						cmdNpList.appendChild(li);
					}

					for (const t of terms) {
						const li = document.createElement('li');
						li.appendChild(document.createTextNode(t.name));
						if (t.count > 1) {
							const dupe = document.createElement('span');
							dupe.className = 'commanduse-dupe';
							dupe.textContent = ' (' + String(t.count) + 'x)';
							li.appendChild(dupe);
						}
						cmdDypList.appendChild(li);
					}
				};

				const parseAvgLengthSeconds = (summary) => {
					const mmRaw = summary && summary.average_track_length_minutes != null
						? String(summary.average_track_length_minutes).trim()
						: '';
					const ssRaw = summary && summary.average_track_length_seconds != null
						? String(summary.average_track_length_seconds).trim()
						: '';
					const mm = Number(mmRaw);
					const ss = Number(ssRaw);
					if (!Number.isFinite(mm) || !Number.isFinite(ss) || mm < 0 || ss < 0) return null;
					return mm * 60 + ss;
				};

				const formatSecondsToClock = (seconds) => {
					const s = Number(seconds);
					if (!Number.isFinite(s) || s < 0) return '0:00';
					return formatMsToClock(Math.round(s * 1000));
				};

				const formatCount = (n) => {
					const num = Number(n);
					if (!Number.isFinite(num) || num < 0) return '0';
					return String(Math.round(num));
				};

				const svgEl = (name) => document.createElementNS('http://www.w3.org/2000/svg', name);
				const svgClear = (svg) => {
					if (!svg) return;
					while (svg.firstChild) svg.removeChild(svg.firstChild);
				};

				const getOrderedPointsForSubset = (subset, valueGetter) => {
					return safeArray(subset)
						.slice()
						.map((s) => ({
							summary: s,
							t: getSummaryTimestampMs(s),
							v: valueGetter(s),
							idx: summaries.indexOf(s),
						}))
						.filter((p) => p && p.idx >= 0 && typeof p.v === 'number' && Number.isFinite(p.v))
						.sort((a, b) => (a.t == null ? 0 : a.t) - (b.t == null ? 0 : b.t));
				};

				const computeIncludeYearForTooltip = (ordered) => {
					if (!ordered || ordered.length < 2) return false;
					const firstT = ordered[0] && typeof ordered[0].t === 'number' ? ordered[0].t : null;
					const lastT = ordered[ordered.length - 1] && typeof ordered[ordered.length - 1].t === 'number'
						? ordered[ordered.length - 1].t
						: null;
					if (!Number.isFinite(firstT) || !Number.isFinite(lastT)) return false;
					const span = Math.abs(lastT - firstT);
					return span > (365 * 24 * 60 * 60 * 1000);
				};

				const renderMiniLineChart = (opts) => {
					const chart = opts && opts.chart;
					const tooltip = opts && opts.tooltip;
					const emptyEl = opts && opts.emptyEl;
					const metaEl = opts && opts.metaEl;
					const meta = opts && typeof opts.meta === 'string' ? opts.meta : '';
					const subset = opts && opts.subset;
					const valueGetter = opts && typeof opts.valueGetter === 'function' ? opts.valueGetter : null;
					const valueFormatter = opts && typeof opts.valueFormatter === 'function' ? opts.valueFormatter : (v) => String(v);
					const tooltipPrefix = opts && typeof opts.tooltipPrefix === 'string' ? opts.tooltipPrefix : '';
					const emptyText = opts && typeof opts.emptyText === 'string' ? opts.emptyText : 'No data was found for this range.';
					if (!chart || !valueGetter) return;
					if (tooltip) tooltip.style.display = 'none';
					if (emptyEl) {
						emptyEl.style.display = 'none';
						emptyEl.textContent = '';
					}
					if (metaEl) metaEl.textContent = meta;
					svgClear(chart);

					const ordered = getOrderedPointsForSubset(subset, valueGetter);
					if (!ordered.length) {
						if (emptyEl) {
							emptyEl.style.display = 'block';
							emptyEl.textContent = emptyText;
						}
						return;
					}

					const includeYearForTooltip = computeIncludeYearForTooltip(ordered);
					const padL = 40;
					const padR = 20;
					const padT = 18;
					const padB = 26;
					const W = 1000;
					const H = 220;
					const plotW = W - padL - padR;
					const plotH = H - padT - padB;

					const ys = ordered.map((p) => p.v);
					let minY = Math.min.apply(null, ys);
					let maxY = Math.max.apply(null, ys);
					if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
						minY = 0;
						maxY = 1;
					}
					if (minY === maxY) {
						minY = Math.max(0, minY - 1);
						maxY = maxY + 1;
					}

					// Add a little headroom/footroom so points don't touch the axes.
					const dataRange = Math.max(1e-9, maxY - minY);
					const padAmount = Math.max(dataRange * 0.08, 1);
					const scaleMin = Math.max(0, minY - padAmount);
					const scaleMax = maxY + padAmount;

					const addTickLabel = (label, y) => {
						const t = svgEl('text');
						t.setAttribute('x', String(padL - 8));
						t.setAttribute('y', String(y));
						t.setAttribute('text-anchor', 'end');
						t.setAttribute('dominant-baseline', 'middle');
						t.setAttribute('class', 'stats-tick');
						t.textContent = String(label);
						chart.appendChild(t);
					};

					const axisX = svgEl('line');
					axisX.setAttribute('x1', String(padL));
					axisX.setAttribute('y1', String(padT + plotH));
					axisX.setAttribute('x2', String(padL + plotW));
					axisX.setAttribute('y2', String(padT + plotH));
					axisX.setAttribute('class', 'stats-axis');
					chart.appendChild(axisX);

					const axisY = svgEl('line');
					axisY.setAttribute('x1', String(padL));
					axisY.setAttribute('y1', String(padT));
					axisY.setAttribute('x2', String(padL));
					axisY.setAttribute('y2', String(padT + plotH));
					axisY.setAttribute('class', 'stats-axis');
					chart.appendChild(axisY);

					// Labels reflect the data min/max (not the padded scale).
					addTickLabel(valueFormatter(maxY), padT);
					addTickLabel(valueFormatter((minY + maxY) / 2), padT + plotH / 2);
					addTickLabel(valueFormatter(minY), padT + plotH);

					const points = [];
					const n = ordered.length;
					for (let i = 0; i < n; i++) {
						const p = ordered[i];
						const x = n === 1
							? (padL + plotW / 2)
							: (padL + (i * plotW) / (n - 1));
						const denom = Math.max(1e-9, scaleMax - scaleMin);
						const norm = (scaleMax - p.v) / denom;
						const y = padT + norm * plotH;
						points.push({ x, y, idx: p.idx, v: p.v, t: p.t, includeYearForTooltip });
					}

					const path = points
						.map((pt, i) => (i === 0 ? 'M' : 'L') + ' ' + pt.x.toFixed(2) + ' ' + pt.y.toFixed(2))
						.join(' ');
					const line = svgEl('path');
					line.setAttribute('d', path);
					line.setAttribute('class', 'stats-line');
					chart.appendChild(line);

					for (const pt of points) {
						const c = svgEl('circle');
						c.setAttribute('cx', pt.x.toFixed(2));
						c.setAttribute('cy', pt.y.toFixed(2));
						c.setAttribute('r', '5');
						c.setAttribute('class', 'stats-point');
						c.setAttribute('data-summary-index', String(pt.idx));
						c.setAttribute('data-val', String(pt.v));
						c.setAttribute('data-ts', pt.t != null ? String(pt.t) : '');
						c.setAttribute('data-include-year', pt.includeYearForTooltip ? '1' : '0');
						c.setAttribute('tabindex', '0');
						c.setAttribute('role', 'button');
						c.setAttribute('aria-label', 'Select stream');
						chart.appendChild(c);
					}

					const hideTooltip = () => {
						if (!tooltip) return;
						tooltip.style.display = 'none';
						while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
					};
					const showTooltip = (e, target) => {
						if (!tooltip || !chart) return;
						const valRaw = target && target.getAttribute ? target.getAttribute('data-val') : '';
						const tsRaw = target && target.getAttribute ? target.getAttribute('data-ts') : '';
						const includeYearRaw = target && target.getAttribute ? target.getAttribute('data-include-year') : '0';
						const val = Number(valRaw);
						const ts = Number(tsRaw);
						if (!Number.isFinite(val) || !Number.isFinite(ts)) {
							hideTooltip();
							return;
						}
						const includeYear = includeYearRaw === '1';
						const d = new Date(ts);
						const dateLabel = formatHumanDate(d, includeYear);
						const valueLabel = valueFormatter(val);
						while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
						const dateEl = document.createElement('div');
						dateEl.className = 'stats-tooltip-date';
						dateEl.textContent = dateLabel;
						const valEl = document.createElement('div');
						valEl.className = 'stats-tooltip-avg';
						valEl.textContent = tooltipPrefix + valueLabel;
						tooltip.appendChild(dateEl);
						tooltip.appendChild(valEl);

						const wrap = chart.parentElement;
						if (!wrap) return;
						const rect = wrap.getBoundingClientRect();
						const x = (e && typeof e.clientX === 'number') ? e.clientX - rect.left : 0;
						const y = (e && typeof e.clientY === 'number') ? e.clientY - rect.top : 0;
						const pad = 12;
						tooltip.style.display = 'block';
						const maxLeft = Math.max(0, rect.width - 20);
						const maxTop = Math.max(0, rect.height - 20);
						tooltip.style.left = String(clamp(x + pad, 0, maxLeft)) + 'px';
						tooltip.style.top = String(clamp(y - pad, 0, maxTop)) + 'px';
					};

					chart.addEventListener('mousemove', (e) => {
						const target = e && e.target ? e.target : null;
						if (!target || !target.getAttribute) {
							hideTooltip();
							return;
						}
						const idx = target.getAttribute('data-summary-index');
						if (idx == null) {
							hideTooltip();
							return;
						}
						showTooltip(e, target);
					});
					chart.addEventListener('mouseleave', () => hideTooltip());

					chart.addEventListener('click', (e) => {
						if (isSelectingFromChart) return;
						const target = e && e.target ? e.target : null;
						if (!target || !target.getAttribute) return;
						const raw = target.getAttribute('data-summary-index');
						const next = Number(raw);
						if (!Number.isFinite(next)) return;
						selectSummaryIndex(next);
					});
					chart.addEventListener('keydown', (e) => {
						if (isSelectingFromChart) return;
						if (!e || (e.key !== 'Enter' && e.key !== ' ')) return;
						const target = e.target;
						if (!target || !target.getAttribute) return;
						const raw = target.getAttribute('data-summary-index');
						const next = Number(raw);
						if (!Number.isFinite(next)) return;
						e.preventDefault();
						selectSummaryIndex(next);
					});
				};

				const renderStatsWith = (subset, meta) => {
					renderMiniLineChart({
						chart: statsChart,
						tooltip: statsTooltip,
						emptyEl: statsEmpty,
						metaEl: statsMeta,
						meta,
						subset,
						valueGetter: (s) => parseAvgLengthSeconds(s),
						valueFormatter: (v) => formatSecondsToClock(v),
						tooltipPrefix: 'Avg: ',
						emptyText: 'No average track length data was found for this range.',
					});
				};

				const renderSongsPlayedWith = (subset, meta) => {
					renderMiniLineChart({
						chart: songsPlayedChart,
						tooltip: songsPlayedTooltip,
						emptyEl: songsPlayedEmpty,
						metaEl: songsPlayedMeta,
						meta,
						subset,
						valueGetter: (s) => {
							const v = s && typeof s.total_tracks_played === 'number' ? s.total_tracks_played : null;
							return (typeof v === 'number' && Number.isFinite(v)) ? v : null;
						},
						valueFormatter: (v) => formatCount(v),
						tooltipPrefix: 'Songs: ',
						emptyText: 'No song counts were found for this range.',
					});
				};

				let analyticsTab = 'topSongs';
				const setAnalyticsTab = (tab) => {
					analyticsTab = tab === 'shortLong'
						? 'shortLong'
						: (tab === 'doubles'
							? 'doubles'
							: (tab === 'commandUse'
								? 'commandUse'
								: (tab === 'stats'
									? 'stats'
									: (tab === 'songsPlayed'
										? 'songsPlayed'
										: (tab === 'searchSongs' ? 'searchSongs' : 'topSongs')))));
					if (topTabTopSongs) {
						topTabTopSongs.classList.toggle('active', analyticsTab === 'topSongs');
						topTabTopSongs.setAttribute('aria-selected', analyticsTab === 'topSongs' ? 'true' : 'false');
					}
					if (topTabShortLong) {
						topTabShortLong.classList.toggle('active', analyticsTab === 'shortLong');
						topTabShortLong.setAttribute('aria-selected', analyticsTab === 'shortLong' ? 'true' : 'false');
					}
					if (topTabDoubles) {
						topTabDoubles.classList.toggle('active', analyticsTab === 'doubles');
						topTabDoubles.setAttribute('aria-selected', analyticsTab === 'doubles' ? 'true' : 'false');
					}
					if (topTabCommandUse) {
						topTabCommandUse.classList.toggle('active', analyticsTab === 'commandUse');
						topTabCommandUse.setAttribute('aria-selected', analyticsTab === 'commandUse' ? 'true' : 'false');
					}
					if (topTabStats) {
						topTabStats.classList.toggle('active', analyticsTab === 'stats');
						topTabStats.setAttribute('aria-selected', analyticsTab === 'stats' ? 'true' : 'false');
					}
					if (topTabSongsPlayed) {
						topTabSongsPlayed.classList.toggle('active', analyticsTab === 'songsPlayed');
						topTabSongsPlayed.setAttribute('aria-selected', analyticsTab === 'songsPlayed' ? 'true' : 'false');
					}
					if (topTabSearchSongs) {
						topTabSearchSongs.classList.toggle('active', analyticsTab === 'searchSongs');
						topTabSearchSongs.setAttribute('aria-selected', analyticsTab === 'searchSongs' ? 'true' : 'false');
					}
					if (topSongsPanel) topSongsPanel.style.display = analyticsTab === 'topSongs' ? 'block' : 'none';
					if (shortLongPanel) shortLongPanel.style.display = analyticsTab === 'shortLong' ? 'block' : 'none';
					if (doublesPanel) doublesPanel.style.display = analyticsTab === 'doubles' ? 'block' : 'none';
					if (commandUsePanel) commandUsePanel.style.display = analyticsTab === 'commandUse' ? 'block' : 'none';
					if (statsPanel) statsPanel.style.display = analyticsTab === 'stats' ? 'block' : 'none';
					if (songsPlayedPanel) songsPlayedPanel.style.display = analyticsTab === 'songsPlayed' ? 'block' : 'none';
					if (searchSongsPanel) searchSongsPanel.style.display = analyticsTab === 'searchSongs' ? 'block' : 'none';
				};

				const renderAnalytics = () => {
					if (!summaries.length) {
						if (topSongsSection) topSongsSection.style.display = 'none';
						return;
					}
					if (topSongsSection) topSongsSection.style.display = 'block';
					const { subset, meta } = getAnalyticsSubsetAndMeta();
					renderTopSongsWith(subset, meta);
					renderShortestLongestWith(subset, meta);
					renderDoublesWith(subset, meta);
					renderCommandUseWith(subset, meta);
					renderStatsWith(subset, meta);
					renderSongsPlayedWith(subset, meta);
					if (searchSongsHasSearched) renderSearchSongsWith(subset);
					setAnalyticsTab(analyticsTab);
				};

				const setTopSongsMode = (mode) => {
					const streams = mode !== 'dates';
					if (topSongsModeStreams) topSongsModeStreams.checked = streams;
					if (topSongsModeDates) topSongsModeDates.checked = !streams;
					// Disable irrelevant inputs so tab order and focus feel correct
					if (topSongsStreamCount) topSongsStreamCount.disabled = !streams;
					const isAll = streams && topSongsStreamCount && topSongsStreamCount.value === 'all';
					if (topSongsStreamNumber) {
						topSongsStreamNumber.disabled = !streams || isAll;
						topSongsStreamNumber.style.display = (!streams || isAll) ? 'none' : '';
					}
					if (topSongsStartDate) topSongsStartDate.disabled = streams;
					if (topSongsEndDate) topSongsEndDate.disabled = streams;
				};

				setTopSongsMode('streams');
				if (topSongsModeStreams) topSongsModeStreams.addEventListener('change', () => {
					setTopSongsMode('streams');
					renderAnalytics();
				});
				if (topSongsModeDates) topSongsModeDates.addEventListener('change', () => {
					setTopSongsMode('dates');
					renderAnalytics();
				});
				if (topSongsStreamCount) topSongsStreamCount.addEventListener('change', () => {
					setTopSongsMode('streams');
					const raw = topSongsStreamCount.value;
					if (raw === 'all') {
						// number input will be hidden/disabled by setTopSongsMode
					} else {
						const picked = Number(raw);
						if (Number.isFinite(picked) && picked > 0 && topSongsStreamNumber) {
							topSongsStreamNumber.value = String(Math.max(1, Math.min(500, picked)));
						}
					}
					renderAnalytics();
				});
				if (topSongsStreamNumber) topSongsStreamNumber.addEventListener('change', () => {
					setTopSongsMode('streams');
					if (topSongsStreamCount) {
						const n = Number(topSongsStreamNumber.value);
						const normalized = Number.isFinite(n) ? Math.max(1, Math.min(500, Math.round(n))) : 10;
						topSongsStreamNumber.value = String(normalized);
						const quickOptions = new Set([5, 10, 15, 20, 30, 40, 50]);
						if (quickOptions.has(normalized)) {
							topSongsStreamCount.value = String(normalized);
						} else {
							// mark as custom
							topSongsStreamCount.value = '';
						}
					}
					renderAnalytics();
				});
				if (topSongsApplyBtn) topSongsApplyBtn.addEventListener('click', () => {
					renderAnalytics();
				});
				if (topTabTopSongs) topTabTopSongs.addEventListener('click', () => {
					setAnalyticsTab('topSongs');
					renderAnalytics();
				});
				if (topTabShortLong) topTabShortLong.addEventListener('click', () => {
					setAnalyticsTab('shortLong');
					renderAnalytics();
				});
				if (topTabDoubles) topTabDoubles.addEventListener('click', () => {
					setAnalyticsTab('doubles');
					renderAnalytics();
				});
				if (topTabCommandUse) topTabCommandUse.addEventListener('click', () => {
					setAnalyticsTab('commandUse');
					renderAnalytics();
				});
				if (topTabStats) topTabStats.addEventListener('click', () => {
					setAnalyticsTab('stats');
					renderAnalytics();
				});
				if (topTabSongsPlayed) topTabSongsPlayed.addEventListener('click', () => {
					setAnalyticsTab('songsPlayed');
					renderAnalytics();
				});
				if (topTabSearchSongs) topTabSearchSongs.addEventListener('click', () => {
					setAnalyticsTab('searchSongs');
					renderAnalytics();
				});
				if (searchSongsBtn) searchSongsBtn.addEventListener('click', () => {
					searchSongsHasSearched = true;
					renderAnalytics();
				});
				if (searchSongsTerm) searchSongsTerm.addEventListener('keydown', (e) => {
					if (!e || e.key !== 'Enter') return;
					searchSongsHasSearched = true;
					e.preventDefault();
					renderAnalytics();
				});

				const render = () => {
					if (!summaries.length) {
						$('report').style.display = 'none';
						$('emptyState').style.display = 'block';
						$('emptyState').textContent = 'No playlist summaries were found.';
						$('sessionTitle').textContent = '';
						olderBtn.disabled = true;
						newerBtn.disabled = true;
						sessionSelect.disabled = true;
						deleteBtn.disabled = true;
						renderTopSongs();
						return;
					}

					$('emptyState').style.display = 'none';
					$('report').style.display = 'grid';
					sessionSelect.disabled = false;
					deleteBtn.disabled = false;

					index = clamp(index, 0, summaries.length - 1);
					const report = summaries[index];

					olderBtn.disabled = index >= summaries.length - 1;
					newerBtn.disabled = index <= 0;

					const dj = report && typeof report.dj_name === 'string' ? report.dj_name : '—';
					const date = report && typeof report.playlist_date === 'string' ? report.playlist_date : '—';
					$('sessionTitle').textContent = '';

					$('summaryFor').textContent = twitchChannelName || dj;
					$('playlistDate').textContent = date;
					$('setStartTime').textContent = (report && report.set_start_time) ? String(report.set_start_time) : '—';
					$('setLength').textContent = formatSetLength(report);
					$('totalTracks').textContent = report && typeof report.total_tracks_played === 'number' ? String(report.total_tracks_played) : '—';
					$('avgTrack').textContent = report && report.average_track_length_minutes != null && report.average_track_length_seconds != null
						? String(report.average_track_length_minutes) + ' minutes, ' + String(report.average_track_length_seconds) + ' seconds'
						: '—';

					// Spotify
					const spotifyWrap = $('spotify');
					while (spotifyWrap.firstChild) spotifyWrap.removeChild(spotifyWrap.firstChild);
					const spotifyLink = report && typeof report.spotify_link === 'string' ? report.spotify_link : '';
					if (spotifyLink) {
						const a = document.createElement('a');
						a.href = spotifyLink;
						a.target = '_blank';
						a.rel = 'noopener noreferrer';
						a.textContent = 'View Playlist';
						spotifyWrap.appendChild(a);

						if (isDiscordAuthorized) {
							const btn = document.createElement('button');
							btn.type = 'button';
							btn.className = 'icon-button';
							btn.title = 'Share playlist to Discord';
							btn.setAttribute('aria-label', 'Share playlist to Discord');
							btn.innerHTML =
								'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
								+ '<circle cx="12" cy="12" r="12" fill="#5865F2" />'
								+ '<path d="M17.5 8.5c-.3-.2-.6-.3-.9-.4-.1-.1-.2-.2-.3-.2-.7-.3-1.4-.5-2.1-.6h-.2c-.1 0-.2.1-.2.2-.1.2-.2.4-.3.6-.7-.1-1.4-.1-2.1 0-.1-.2-.2-.4-.3-.6-.1-.1-.2-.2-.2-.2h-.2c-.7.1-1.4.3-2.1.6-.1.1-.2.1-.3.2-.3.1-.6.2-.9.4-.1.1-.2.2-.2.3-.7 1.1-1.1 2.3-1.1 3.6 0 .1 0 .2.1.2.6.5 1.2.9 1.9 1.2.1 0 .2 0 .3-.1.2-.2.4-.4.6-.6.1-.1.2-.1.3-.1.7.2 1.4.3 2.1.3s1.4-.1 2.1-.3c.1 0 .2 0 .3.1.2.2.4.4.6.6.1.1.2.1.3.1.7-.3 1.3-.7 1.9-1.2.1-.1.1-.1.1-.2 0-1.3-.4-2.5-1.1-3.6-.1-.1-.1-.2-.2-.3zm-7.1 4.1c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6zm5.2 0c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6z" fill="#fff" />'
								+ '</svg>';

							const status = document.createElement('span');
							status.className = 'copy-status';
							status.textContent = '';

							btn.addEventListener('click', async () => {
								if (!discordShareNonce) {
									status.textContent = 'Discord sharing unavailable';
									setTimeout(() => {
										status.textContent = '';
									}, 4000);
									return;
								}

								status.textContent = 'Posting to Discord...';
								try {
									const sessionDate = report && report.session_date ? report.session_date : null;
									const resp = await fetch('http://127.0.0.1:5003/discord/share-playlist', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({
											spotifyURL: spotifyLink,
											sessionDate,
											twitchChannelName,
											nonce: discordShareNonce,
										}),
									});
									let data = null;
									try {
										data = await resp.json();
									} catch {}

									status.textContent = (resp.ok && data && data.success === true)
										? 'Posted to Discord'
										: (data && data.message ? data.message : 'Failed to share');
								} catch {
									status.textContent = 'Failed to share';
								}

								setTimeout(() => {
									status.textContent = '';
								}, 5000);
							});

							spotifyWrap.appendChild(btn);
							spotifyWrap.appendChild(status);
						}
					} else {
						spotifyWrap.textContent = 'No playlist created for this stream.';
					}

					// Doubles
					const doubles = safeArray(report && report.doubles_played);
					const doublesHeader = $('doublesHeader');
					const doublesListEl = $('doublesList');
					const doublesEmptyEl = $('doublesEmpty');
					clearList(doublesListEl);
					if (!doubles.length) {
						doublesHeader.style.display = 'none';
						doublesEmptyEl.style.display = 'block';
						doublesEmptyEl.textContent = 'There were no doubles detected during this set.';
						doublesListEl.style.display = 'none';
					} else {
						doublesHeader.style.display = 'block';
						doublesEmptyEl.style.display = 'none';
						doublesListEl.style.display = 'block';
						$('doublesCount').textContent = String(doubles.length);
						for (const d of doubles) {
							const id = d && typeof d.track_id === 'string' ? d.track_id : '';
							if (id) addListItem(doublesListEl, id);
						}
					}

					// !np songs
					const np = safeArray(report && report.np_songs_queried);
					const npHeader = $('npHeader');
					const npListEl = $('npList');
					const npEmptyEl = $('npEmpty');
					clearList(npListEl);
					if (!np.length) {
						npHeader.style.display = 'none';
						npEmptyEl.style.display = 'block';
						npEmptyEl.innerHTML = 'The <span class="cmd">!np</span> command was not used during this stream.';
						npListEl.style.display = 'none';
					} else {
						npHeader.style.display = 'block';
						npEmptyEl.style.display = 'none';
						npListEl.style.display = 'block';
						$('npCount').textContent = String(np.length);
						for (const item of uniqueCounts(np)) {
							addListItem(npListEl, item.name + (item.count > 1 ? ' (' + item.count + ' times)' : ''));
						}
					}

					// !dyp terms
					const dyp = safeArray(report && report.dyp_search_terms);
					const dypHeader = $('dypHeader');
					const dypListEl = $('dypList');
					const dypEmptyEl = $('dypEmpty');
					clearList(dypListEl);
					if (!dyp.length) {
						dypHeader.style.display = 'none';
						dypEmptyEl.style.display = 'block';
						dypEmptyEl.innerHTML = 'The <span class="cmd">!dyp</span> command was not used during this stream.';
						dypListEl.style.display = 'none';
					} else {
						dypHeader.style.display = 'block';
						dypEmptyEl.style.display = 'none';
						dypListEl.style.display = 'block';
						$('dypCount').textContent = String(dyp.length);
						for (const item of uniqueCounts(dyp)) {
							addListItem(dypListEl, '"' + item.name + '"' + (item.count > 1 ? ' (' + item.count + ' times)' : ''));
						}
					}

					renderAnalytics();
				};

				// Build session dropdown
				const rebuildSelect = () => {
					while (sessionSelect.firstChild) sessionSelect.removeChild(sessionSelect.firstChild);
					for (let i = 0; i < summaries.length; i++) {
						const s = summaries[i] || {};
						const date = typeof s.playlist_date === 'string' ? s.playlist_date : ('Session ' + (i + 1));
						const dj = typeof s.dj_name === 'string' ? s.dj_name : '';
						const opt = document.createElement('option');
						opt.value = String(i);
						opt.textContent = dj ? (date + ' — ' + dj) : date;
						sessionSelect.appendChild(opt);
					}
				};
				rebuildSelect();

				const syncSelect = () => {
					sessionSelect.value = String(index);
				};

				olderBtn.addEventListener('click', () => {
					index = clamp(index + 1, 0, summaries.length - 1);
					syncSelect();
					render();
				});

				newerBtn.addEventListener('click', () => {
					index = clamp(index - 1, 0, summaries.length - 1);
					syncSelect();
					render();
				});

				sessionSelect.addEventListener('change', () => {
					const next = Number(sessionSelect.value);
					if (Number.isFinite(next)) index = clamp(next, 0, summaries.length - 1);
					render();
				});

				deleteBtn.addEventListener('click', () => {
					const report = summaries[index];
					const playlistId = report && typeof report._id === 'string' ? report._id : '';
					openDeleteModal(playlistId);
				});

				deleteCancelBtn.addEventListener('click', () => {
					closeDeleteModal();
				});

				deleteModal.addEventListener('click', (e) => {
					if (e && e.target === deleteModal) closeDeleteModal();
				});

				document.addEventListener('keydown', (e) => {
					if (e && e.key === 'Escape') closeDeleteModal();
				});

				deleteConfirmBtn.addEventListener('click', async () => {
					if (!pendingDeleteId) return;
					if (!discordShareNonce) return;

					deleteConfirmBtn.disabled = true;
					deleteCancelBtn.disabled = true;
					try {
						const resp = await fetch('http://127.0.0.1:5003/playlists/delete', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								playlistId: pendingDeleteId,
								nonce: discordShareNonce,
							}),
						});
						let data = null;
						try { data = await resp.json(); } catch {}

						if (resp.ok && data && data.success === true) {
							const removedIdx = summaries.findIndex(
								(s) => s && typeof s._id === 'string' && s._id === pendingDeleteId
							);
							if (removedIdx >= 0) {
								summaries.splice(removedIdx, 1);
								index = clamp(index, 0, Math.max(0, summaries.length - 1));
							}
							rebuildSelect();
							syncSelect();
							render();
							closeDeleteModal();
						} else {
							alert((data && data.message) ? data.message : 'Failed to delete playlist.');
						}
					} catch {
						alert('Failed to delete playlist.');
					} finally {
						deleteConfirmBtn.disabled = false;
						deleteCancelBtn.disabled = false;
					}
				});

				syncSelect();
				render();
			})();
		</script>
	</body>
</html>`
}
