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

				let pendingDeleteId = '';

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
