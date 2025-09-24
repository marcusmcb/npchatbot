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
		const ready = await waitForServer(devServerUrl)
		if (!ready) {
			console.error('Client dev server did not start in time.')
			return mainWindow
		}
	}

	mainWindow.loadURL(appURL)

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
		// Match existing behavior: open devtools
		mainWindow.webContents.openDevTools()
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
