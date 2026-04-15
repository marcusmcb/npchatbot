const fs = require('fs')
const path = require('path')
const https = require('https')
const { pathToFileURL } = require('url')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const WebSocket = require('ws')
const express = require('express')
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { createMainWindow } = require('./scripts/createMainWindow')
const { waitForServer } = require('./scripts/waitForServer')

// bot config/initialization, and utility methods
const db = require('./database/database')
const loadConfigurations = require('./config')
const initializeBot = require('./index')
const { handleStartBotScript } = require('./bot-scripts/handleStartBotScript')
const { handleStopBotScript } = require('./bot-scripts/handleStopBotScript')
const logToFile = require('./scripts/logger')

// auth handlers and user data methods
const { handleTwitchAuth } = require('./auth/twitch/handleTwitchAuth')
const { handleSpotifyAuth } = require('./auth/spotify/handleSpotifyAuth')
const { getDiscordAuthUrl } = require('./auth/discord/handleDiscordAuth')
const {
	startSpotifyCallbackServer,
} = require('./auth/spotify/spotifyCallbackServer')
const {
	startDiscordCallbackServer,
} = require('./auth/discord/discordCallbackServer')
const {
	handleGetUserData,
} = require('./database/helpers/userData/handleGetUserData')
const {
	handleSubmitUserData,
} = require('./database/helpers/userData/handleSubmitUserData')

// serato live playlist status validation
const {
	validateLivePlaylist,
} = require('./database/helpers/validations/validateLivePlaylist')

// user data handler
const getUserData = require('./database/helpers/userData/getUserData')
const { getToken } = require('./database/helpers/tokens')

/* PLAYLIST HANDLERS */
const {
	createPlaylistSummary,
} = require('./bot-assets/summary/createPlaylistSummary')
const {
	getCurrentPlaylistSummary,
} = require('./bot-assets/command-use/commandUse')
const {
	getPlaylistSummaries,
} = require('./database/helpers/playlistSummaries/getPlaylistSummaries')
const {
	getPlaylistSummaryData,
} = require('./database/helpers/playlistSummaries/getPlaylistSummaryData')
const {
	repairPlaylistSummaries,
} = require('./database/helpers/playlistSummaries/repairPlaylistSummaries')
const { addPlaylist } = require('./database/helpers/playlists/addPlaylist')
const {
	sharePlaylistToDiscord,
} = require('./database/helpers/playlists/sharePlaylistToDiscord')
const {
	deletePlaylist,
} = require('./database/helpers/playlists/deletePlaylist')

// check if the app is started by Squirrel.Windows
if (require('electron-squirrel-startup')) app.quit()

// https cert options, used during twitch & spotify auth processes
const options = {
	key: fs.readFileSync(path.join(__dirname, './server.key')),
	cert: fs.readFileSync(path.join(__dirname, './server.cert')),
}

// load environment variables & set path
const envPath = path.join(__dirname, '.env')
dotenv.config({ path: envPath })

// environment variables
let mainWindow
let tmiInstance
let serverInstance
let botProcess = false
let isConnected = false

// server config and middleware
const server = express()
const PORT = process.env.PORT || 5002
const SPOTIFY_HTTP_PORT = 5001
const DISCORD_HTTP_PORT = 5003
server.use(bodyParser.json())
server.use(cors())

const isDev = !app.isPackaged
process.env.NODE_ENV = isDev ? 'development' : 'production'
// Enable a conservative Keychain fallback on macOS packaged builds
if (process.platform === 'darwin' && app.isPackaged) {
	process.env.KEYCHAIN_ACCOUNT_FALLBACK = 'true'
}

// socket config for auth responses
const wss = new WebSocket.Server({ port: 8080 })

// utility method to start app server
const startServer = () => {
	serverInstance = https.createServer(options, server).listen(PORT, () => {
		console.log(`npChatbot HTTPS server is running on port ${PORT}`)
	})
}

// start Discord auth callback server
let discordCallbackServer = null

try {
	discordCallbackServer = startDiscordCallbackServer({
		port: DISCORD_HTTP_PORT,
		wss,
		getMainWindow: () => mainWindow,
	})
} catch (e) {
	console.error('Failed to start Discord callback server:', e)
}

// start Spotify auth callback server
let spotifyCallbackServer = null

try {
	spotifyCallbackServer = startSpotifyCallbackServer({
		port: SPOTIFY_HTTP_PORT,
		wss,
		getMainWindow: () => mainWindow,
	})
} catch (e) {
	console.error('Failed to start Spotify callback server:', e)
}

server.get('/', (req, res) => {
	res.send('NPChatbot is up and running')
})

const buildPlaylistSummariesHtml = ({ playlistSummaries, currentReportIndex }) => {
	const payload = {
		generatedAt: new Date().toISOString(),
		currentReportIndex,
		playlistSummaries,
	}

	const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString(
		'base64'
	)

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" />
		<title>npChatbot Playlist Summaries</title>
		<style>
			:root {
				--bg: #0f172a;
				--panel: #111c33;
				--text: #e5e7eb;
				--muted: #9ca3af;
				--accent: #38bdf8;
				--border: rgba(255, 255, 255, 0.12);
			}
			* { box-sizing: border-box; }
			body {
				margin: 0;
				font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif;
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
			}
			.subtitle {
				color: var(--muted);
				font-size: 12px;
			}
			.controls {
				display: flex;
				gap: 8px;
				align-items: center;
				margin: 12px 0 16px;
			}
			button, select {
				background: var(--panel);
				color: var(--text);
				border: 1px solid var(--border);
				border-radius: 8px;
				padding: 8px 10px;
				font-size: 13px;
			}
			button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			select {
				flex: 1;
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
			}
			.kv {
				display: grid;
				grid-template-columns: 180px 1fr;
				gap: 6px 12px;
				font-size: 13px;
			}
			.k {
				color: var(--muted);
			}
			.v a {
				color: var(--accent);
				text-decoration: none;
			}
			.v a:hover { text-decoration: underline; }
			.badge {
				display: inline-block;
				padding: 2px 8px;
				border-radius: 999px;
				border: 1px solid var(--border);
				color: var(--accent);
				font-size: 12px;
				margin-left: 6px;
			}
			.list {
				margin: 8px 0 0;
				padding-left: 18px;
				font-size: 13px;
			}
			.empty {
				color: var(--muted);
				font-size: 13px;
			}
			footer {
				margin-top: 14px;
				color: var(--muted);
				font-size: 12px;
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
				<select id="sessionSelect" aria-label="Select a playlist summary"></select>
				<button id="newerBtn" type="button">Newer</button>
			</div>

			<div id="emptyState" class="panel empty" style="display:none;"></div>

			<div id="report" class="report" style="display:none;">
				<div class="panel">
					<h2>Summary</h2>
					<div class="kv">
						<div class="k">DJ</div><div class="v" id="djName"></div>
						<div class="k">Playlist date</div><div class="v" id="playlistDate"></div>
						<div class="k">Set start time</div><div class="v" id="setStartTime"></div>
						<div class="k">Set length</div><div class="v" id="setLength"></div>
						<div class="k">Total tracks played</div><div class="v" id="totalTracks"></div>
						<div class="k">Average track length</div><div class="v" id="avgTrack"></div>
						<div class="k">Spotify</div><div class="v" id="spotify"></div>
					</div>
				</div>

				<div class="panel">
					<h2>Doubles detected <span class="badge" id="doublesCount"></span></h2>
					<div id="doublesEmpty" class="empty" style="display:none;"></div>
					<ul id="doublesList" class="list"></ul>

					<hr style="border:0;border-top:1px solid var(--border); margin: 14px 0;" />

					<h2>Songs queried <span class="badge" id="npCount"></span></h2>
					<div id="npEmpty" class="empty" style="display:none;"></div>
					<ul id="npList" class="list"></ul>

					<hr style="border:0;border-top:1px solid var(--border); margin: 14px 0;" />

					<h2>Terms searched <span class="badge" id="dypCount"></span></h2>
					<div id="dypEmpty" class="empty" style="display:none;"></div>
					<ul id="dypList" class="list"></ul>
				</div>
			</div>

			<footer>
				This page is generated locally by npChatbot. It contains your playlist summary data and is stored on your machine.
			</footer>
		</div>

		<script>
			(() => {
				const payloadB64 = ${JSON.stringify(payloadB64)};

				const $ = (id) => document.getElementById(id);
				const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

				const decodePayload = (b64) => {
					try {
						const json = atob(b64);
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

				const payload = decodePayload(payloadB64);
				const summaries = safeArray(payload.playlistSummaries);
				let index = clamp(Number(payload.currentReportIndex) || 0, 0, Math.max(0, summaries.length - 1));

				$('generatedAt').textContent = payload.generatedAt || '';

				const olderBtn = $('olderBtn');
				const newerBtn = $('newerBtn');
				const sessionSelect = $('sessionSelect');

				const render = () => {
					if (!summaries.length) {
						$('report').style.display = 'none';
						$('emptyState').style.display = 'block';
						$('emptyState').textContent = 'No playlist summaries were found.';
						$('sessionTitle').textContent = '';
						olderBtn.disabled = true;
						newerBtn.disabled = true;
						sessionSelect.disabled = true;
						return;
					}

					$('emptyState').style.display = 'none';
					$('report').style.display = 'grid';
					sessionSelect.disabled = false;

					index = clamp(index, 0, summaries.length - 1);
					const report = summaries[index];

					olderBtn.disabled = index >= summaries.length - 1;
					newerBtn.disabled = index <= 0;

					const dj = report && typeof report.dj_name === 'string' ? report.dj_name : '—';
					const date = report && typeof report.playlist_date === 'string' ? report.playlist_date : '—';
					$('sessionTitle').textContent = date + ' — ' + dj;

					$('djName').textContent = dj;
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
					} else {
						spotifyWrap.textContent = 'No playlist created for this stream.';
					}

					// Doubles
					const doubles = safeArray(report && report.doubles_played);
					$('doublesCount').textContent = String(doubles.length);
					clearList($('doublesList'));
					if (!doubles.length) {
						$('doublesEmpty').style.display = 'block';
						$('doublesEmpty').textContent = 'There were no doubles detected during this set.';
					} else {
						$('doublesEmpty').style.display = 'none';
						for (const d of doubles) {
							const id = d && typeof d.track_id === 'string' ? d.track_id : '';
							if (id) addListItem($('doublesList'), id);
						}
					}

					// !np songs
					const np = safeArray(report && report.np_songs_queried);
					$('npCount').textContent = String(np.length);
					clearList($('npList'));
					if (!np.length) {
						$('npEmpty').style.display = 'block';
						$('npEmpty').textContent = 'The !np command was not used during this stream.';
					} else {
						$('npEmpty').style.display = 'none';
						for (const item of uniqueCounts(np)) {
							addListItem($('npList'), item.name + (item.count > 1 ? ' (' + item.count + ' times)' : ''));
						}
					}

					// !dyp terms
					const dyp = safeArray(report && report.dyp_search_terms);
					$('dypCount').textContent = String(dyp.length);
					clearList($('dypList'));
					if (!dyp.length) {
						$('dypEmpty').style.display = 'block';
						$('dypEmpty').textContent = 'The !dyp command was not used during this stream.';
					} else {
						$('dypEmpty').style.display = 'none';
						for (const item of uniqueCounts(dyp)) {
							addListItem($('dypList'), '"' + item.name + '"' + (item.count > 1 ? ' (' + item.count + ' times)' : ''));
						}
					}
				};

				// Build session dropdown
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

				syncSelect();
				render();
			})();
		</script>
	</body>
</html>`
}

ipcMain.on('open-auth-settings', (event, url) => {
	shell.openExternal(url)
})

ipcMain.handle('open-playlist-summaries-in-browser', async (_event, payload) => {
	try {
		const playlistSummaries = Array.isArray(payload?.playlistSummaries)
			? payload.playlistSummaries
			: []
		const idxRaw = Number(payload?.currentReportIndex ?? 0)
		const currentReportIndex = Number.isFinite(idxRaw) ? idxRaw : 0

		const reportsDir = path.join(app.getPath('userData'), 'reports')
		await fs.promises.mkdir(reportsDir, { recursive: true })

		const filePath = path.join(reportsDir, 'playlist-summaries.html')
		const html = buildPlaylistSummariesHtml({
			playlistSummaries,
			currentReportIndex,
		})
		await fs.promises.writeFile(filePath, html, { encoding: 'utf8' })

		const fileUrl = pathToFileURL(filePath).toString()
		await shell.openExternal(fileUrl)

		return { success: true, fileUrl }
	} catch (e) {
		console.error('Failed to open playlist summaries in browser:', e)
		return { success: false, error: String(e?.message || e) }
	}
})

// Accept logs forwarded from renderer process (preload.logToMain)
ipcMain.on('renderer-log', (_event, message) => {
	try {
		const pretty =
			typeof message === 'object'
				? JSON.stringify(message, null, 2)
				: String(message)
		// Write to file and also to console
		logToFile(`[renderer] ${pretty}`)
		// console.log('[renderer]', pretty)
	} catch (e) {
		console.error('Failed to write renderer log to file', e)
	}
})

ipcMain.on('get-user-data', async (event, arg) => {
	const response = await handleGetUserData()
	event.reply('getUserDataResponse', response)
})

ipcMain.handle('get-user-data', async (_event, _arg) => {
	const response = await handleGetUserData()
	return response
})

ipcMain.on('userDataUpdated', () => {
	mainWindow.webContents.send('userDataUpdated')
})

ipcMain.on('open-spotify-link', (event, spotifyUrl) => {
	shell.openExternal(spotifyUrl)
})

ipcMain.on('open-twitch-auth-url', async (event, arg) => {
	handleTwitchAuth(event, arg, mainWindow, wss)
})

ipcMain.on('delete-selected-playlist', async (event, arg) => {
	await deletePlaylist(arg, event)
})

ipcMain.on('get-playlist-summaries', async (event, _arg) => {
	try {
		const summaries = await getPlaylistSummaries()
		event.reply(
			'get-playlist-summaries-response',
			Array.isArray(summaries) ? summaries : []
		)
	} catch (e) {
		console.error('Failed to fetch playlist summaries:', e)
		event.reply('get-playlist-summaries-response', null)
	}
})

ipcMain.on('submit-user-data', async (event, arg) => {
	handleSubmitUserData(event, arg, mainWindow)
})

ipcMain.on('open-spotify-auth-url', async (event, arg) => {
	const spotifyRedirectUri = `http://127.0.0.1:5001/auth/spotify/callback/`
	console.log('Spotify Redirect URI: ', spotifyRedirectUri)
	handleSpotifyAuth(event, arg, mainWindow, wss, spotifyRedirectUri)
})

ipcMain.on('open-discord-auth-url', async (event, arg) => {
	const state = 'npchatbot-' + Date.now()
	const discordAuthUrl = getDiscordAuthUrl(state)
	shell.openExternal(discordAuthUrl)
})

ipcMain.on('validate-live-playlist', async (event, arg) => {
	const isValid = await validateLivePlaylist(arg.url)
	event.reply('validate-live-playlist-response', { isValid: isValid })
})

ipcMain.on('update-connection-state', (event, state) => {
	isConnected = state
})

ipcMain.on('share-playlist-to-discord', async (event, payload) => {
	const { spotifyURL, sessionDate } = payload || {}
	const userData = await getUserData(db)
	const twitchChannelName = userData?.twitchChannelName
	// use webhook URL from keytar token blob if available, otherwise fall back to legacy DB field
	let webhookURL = null
	try {
		if (userData && userData._id) {
			const discordBlob = await getToken('discord', userData._id)
			webhookURL = discordBlob?.webhook?.url || null
		}
	} catch (e) {
		// keytar may not be available in some environments; fall back to DB
		webhookURL = null
	}
	if (!webhookURL) webhookURL = userData?.discord?.webhook_url || null
	await sharePlaylistToDiscord(
		spotifyURL,
		webhookURL,
		twitchChannelName,
		sessionDate,
		event
	)
})

// ipc handler for the Twitch connection process
ipcMain.on('start-bot-script', async (event, arg) => {
	const validStartResponse = await handleStartBotScript(event, arg, botProcess)
	if (validStartResponse === false) {
		return
	}
	// load configurations and initialize chatbot script
	setTimeout(() => {
		loadConfigurations()
			.then((config) => {
				setTimeout(async () => {
					const init = await initializeBot(config)
					tmiInstance = init
					botProcess === true
					event.reply('start-bot-response', {
						success: true,
						message: 'npChatbot is connected to your Twitch channel.',
					})
				}, 1000)
			})
			.catch((err) => {
				logToFile(`Error loading configurations: ${err}`)
				logToFile('*******************************')
				console.error('Error loading configurations:', err)
			})
			.finally(() => {
				console.log('------------------')
				console.log('Bot started successfully')
				console.log('------------------')
			})
	}, 1000)
})

// ipc handler for the Twitch disconnection process
ipcMain.on('stop-bot-script', async (event, arg) => {
	const playlistData = await getCurrentPlaylistSummary()
	console.log('Playlist data: ', playlistData)
	if (playlistData) {
		const finalPlaylistData = await createPlaylistSummary(playlistData)
		const user = await getUserData(db)
		if (user) {
			if (user.isSpotifyEnabled) {
				finalPlaylistData.spotify_link = user.currentSpotifyPlaylistLink
			} else {
				finalPlaylistData.spotify_link = ''
			}
		}
		await addPlaylist(finalPlaylistData)
	} else {
		console.log('No playlist data found to insert into database.')
	}

	await handleStopBotScript(event, arg, tmiInstance)
	console.log('----- STOPPING BOT SCRIPT -----')
	tmiInstance = null
	botProcess = false
	isConnected = false
	console.log('npChatbot successfully disconnected from Twitch')
	console.log('--------------------------------------')
})

// create the main application window via helper
const initMainWindow = async () => {
	const preloadPath = path.join(__dirname, './scripts/preload.js')
	const iconPath = path.join(__dirname, './client/public/favicon.ico')
	const appHtmlFilePath = path.join(__dirname, './client/build/index.html')

	// In dev, CRA may auto-select a different port (e.g., 3001) if 3000 is busy.
	// We pin CRA to 3001 in client/package.json, so prefer that by default.
	// We still probe alternates to support overrides and unusual environments.
	let devServerUrl = process.env.REACT_DEV_SERVER_URL || 'http://127.0.0.1:3001'
	if (isDev) {
		const candidates = [
			process.env.REACT_DEV_SERVER_URL,
			'http://127.0.0.1:3001',
			'http://localhost:3001',
			'http://127.0.0.1:3000',
			'http://localhost:3000',
		].filter(Boolean)

		const uniqueCandidates = [...new Set(candidates)]
		// CRA can take a bit to boot; keep probing for up to 60s total.
		const start = Date.now()
		const overallTimeoutMs = 60000
		while (Date.now() - start < overallTimeoutMs) {
			let found = null
			for (const url of uniqueCandidates) {
				try {
					const ok = await waitForServer(url, 1200)
					if (ok) {
						found = url
						break
					}
				} catch (e) {
					// ignore and try next candidate
				}
			}
			if (found) {
				devServerUrl = found
				break
			}
			await new Promise((r) => setTimeout(r, 250))
		}
	}

	mainWindow = await createMainWindow({
		isDev,
		getIsConnected: () => isConnected,
		onForceClose: () => {
			tmiInstance = null
			botProcess = false
			isConnected = false
			app.quit()
		},
		preloadPath,
		iconPath,
		waitForServer,
		devServerUrl,
		appHtmlFilePath,
	})
}

// use the async createWindow everywhere
app.on('activate', async () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		await initMainWindow()
	}
})

app.on('ready', async () => {
	startServer()
	// run migration before creating the main window so tokens are migrated on app startup.
	// controlled by env var MIGRATE_ON_STARTUP (default: enabled). Set to 'false' to skip.
	const migrateFlag = process.env.MIGRATE_ON_STARTUP
	if (migrateFlag === undefined || migrateFlag.toLowerCase() !== 'false') {
		try {
			const { migrateAllUsers } = require('./database/helpers/migrateTokens')
			// run migration in the background so it cannot block UI startup. We log completion when it finishes.
			try {
				// default to removing legacy fields on startup migration; set MIGRATE_REMOVE_LEGACY=false to keep legacy values
				const removeLegacy =
					(process.env.MIGRATE_REMOVE_LEGACY || 'true').toLowerCase() === 'true'
				migrateAllUsers({ compact: true, removeLegacy })
					.then((summary) => {
						if (summary) {
							console.log('Startup token migration completed. Summary:')
							console.log(`  usersScanned: ${summary.usersScanned}`)
							console.log(
								`  migrated: spotify=${summary.migrated.spotify}, discord=${summary.migrated.discord}, twitch=${summary.migrated.twitch}`
							)
							if (summary.errors && summary.errors.length > 0) {
								console.error('  migration errors:')
								console.error(JSON.stringify(summary.errors, null, 2))
							} else {
								console.log('  no migration errors')
							}
						} else {
							console.log('Startup token migration completed with no summary.')
						}
					})
					.catch((e) => console.error('Startup migration failed:', e))
			} catch (e) {
				console.error('Startup migration invocation failed:', e)
			}
		} catch (e) {
			console.error(
				'Migration module not available during startup migration:',
				e
			)
		}
	} else {
		console.log(
			'MIGRATE_ON_STARTUP is set to false, skipping startup migration.'
		)
	}
	await initMainWindow()
})

app.on('before-quit', () => {
	if (mainWindow) {
		mainWindow.destroy()
	}
	if (serverInstance) {
		serverInstance.close(() => {
			console.log('Server closed.')
		})
	}
	if (discordCallbackServer) {
		try {
			discordCallbackServer.close(() => {
				console.log('Discord callback server closed.')
			})
		} catch (e) {
			console.error('Error closing Discord callback server:', e)
		}
	}
	if (spotifyCallbackServer) {
		try {
			spotifyCallbackServer.close(() => {
				console.log('Spotify callback server closed.')
			})
		} catch (e) {
			console.error('Error closing Spotify callback server:', e)
		}
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
