const path = require('path')
const { app, BrowserWindow, dialog } = require('electron')

/**
 * Creates the main application BrowserWindow.
 *
 * @param {Object} params
 * @param {boolean} params.isDev - Whether running in development mode
 * @param {() => boolean} params.getIsConnected - Returns whether the bot is currently connected
 * @param {() => void} params.onForceClose - Called to perform cleanup and quit when user confirms closing while connected
 * @param {string} params.preloadPath - Absolute path to the preload script
 * @param {string} params.iconPath - Absolute path to the window icon
 * @param {() => Promise<boolean>} params.waitForServer - Async function to wait for dev server readiness
 * @param {string} params.devServerUrl - URL for the dev server (e.g., http://127.0.0.1:3000)
 * @param {string} params.appHtmlFilePath - Absolute path to the built index.html for production
 * @returns {Promise<BrowserWindow>} The created BrowserWindow instance
 */

const createMainWindow = async ({
	isDev,
	getIsConnected,
	onForceClose,
	preloadPath,
	iconPath,
	waitForServer,
	devServerUrl,
	appHtmlFilePath,
}) => {
	const mainWindow = new BrowserWindow({
		width: 1130,
		height: 525,
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: 'rgb(49, 49, 49)',
			symbolColor: 'white',
		},
		resizable: false,
		webPreferences: {
			preload: preloadPath,
			nodeIntegration: false,
			contextIsolation: true,
		},
		icon: iconPath,
	})

	const appURL = isDev ? devServerUrl : `file://${appHtmlFilePath}`

	if (isDev) {
		// Show something immediately so we don't end up with a white window while CRA boots.
		const loadingHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'" />
    <title>npChatbot - Starting</title>
  </head>
  <body style="margin:0; background: rgb(49,49,49); color: #fff; font-family: sans-serif;">
    <div style="padding: 18px;">
      <div style="font-size: 20px; color: rgb(74,242,228); margin-bottom: 10px;">Starting npChatbot…</div>
      <div style="opacity: 0.9;">Waiting for React dev server:</div>
      <div style="margin-top: 6px; font-family: monospace;">${String(devServerUrl || '')}</div>
      <div style="margin-top: 14px; opacity: 0.7;">If this takes more than ~1 minute, restart <b>npm run dev</b>.</div>
    </div>
  </body>
</html>`
		try {
			await mainWindow.loadURL(
				`data:text/html;charset=utf-8,${encodeURIComponent(loadingHtml)}`
			)
		} catch {}

		const ready = await waitForServer(devServerUrl, 60000)
		if (!ready) {
			console.error('Client dev server did not start in time.')
			// Still try loading the URL so Electron displays an error page instead of staying blank.
			try {
				mainWindow.loadURL(appURL)
			} catch {}
			return mainWindow
		}
	}

	mainWindow.loadURL(appURL)

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
		// Open DevTools automatically in development for renderer logs
		// if (isDev) {
		// 	try {
		// 		mainWindow.webContents.openDevTools({ mode: 'detach' })
		// 	} catch (e) {
		// 		console.warn('Failed to open DevTools automatically:', e)
		// 	}
		// }
	})

	mainWindow.on('close', (event) => {
		if (getIsConnected && getIsConnected()) {
			event.preventDefault()
			const response = dialog.showMessageBoxSync(mainWindow, {
				type: 'warning',
				buttons: ['Cancel', 'Close'],
				defaultId: 0,
				title: 'Closing npChatbot...',
				message:
					'npChatbot is currently connected to your Twitch channel. Are you sure you want to close it?',
			})
			if (response === 1) {
				if (onForceClose) onForceClose()
			}
		} else {
			app.quit()
		}
	})

	return mainWindow
}

module.exports = { createMainWindow }
