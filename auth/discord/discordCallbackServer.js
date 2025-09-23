const http = require('http')
const { initDiscordAuthToken } = require('./handleDiscordAuth')

/**
 * Starts a lightweight HTTP server to handle Discord OAuth callbacks.
 *
 * Params:
 * - port: number (defaults to 5003)
 * - wss: WebSocket.Server instance used to notify renderer(s)
 * - getMainWindow: () => Electron.BrowserWindow | undefined
 *
 * Returns the created http.Server instance.
 */

const startDiscordCallbackServer = ({ port = 5003, wss, getMainWindow }) => {
	if (!wss) {
		throw new Error(
			'startDiscordCallbackServer requires a WebSocket server (wss).'
		)
	}

	const server = http.createServer(async (req, res) => {
		try {
			if (req.url && req.url.startsWith('/auth/discord/callback')) {
				const urlObj = new URL(req.url, `http://127.0.0.1:${port}`)
				const code = urlObj.searchParams.get('code')
				const error = urlObj.searchParams.get('error')
				const state = urlObj.searchParams.get('state')

				if (error) {
					console.log('Discord Auth Error:', error)
					res.writeHead(400, { 'Content-Type': 'text/plain' })
					res.end('Discord authorization failed.')
					return
				}

				if (!code) {
					console.log('No authorization code received.')
					res.writeHead(400, { 'Content-Type': 'text/plain' })
					res.end('No authorization code received.')
					return
				}

				if (code) {
					await initDiscordAuthToken(
						code,
						wss,
						getMainWindow && getMainWindow()
					)
					setTimeout(() => {
						console.log('Discord auth token initialized.')
					}, 100)
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' })
				res.end('Discord authorization successful! You may close this window.')
			} else {
				res.writeHead(404, { 'Content-Type': 'text/plain' })
				res.end('Not Found')
			}
		} catch (err) {
			console.error('Error in Discord callback handler:', err)
			try {
				res.writeHead(500, { 'Content-Type': 'text/plain' })
				res.end('Internal Server Error')
			} catch {}
		}
	})

	server.listen(port, () => {
		console.log(`Discord auth callback HTTP server running on port ${port}`)
	})

	return server
}

module.exports = {
	startDiscordCallbackServer,
}
