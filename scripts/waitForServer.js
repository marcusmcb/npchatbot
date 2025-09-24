const http = require('http')
const https = require('https')
const { URL } = require('url')

/**
 * Polls the given URL until it responds or the timeout elapses.
 * Uses a lightweight HEAD request over http/https with a short per-attempt timeout.
 * @param {string} urlStr - The URL to check for readiness
 * @param {number} [timeout=15000] - Total timeout in milliseconds
 * @returns {Promise<boolean>} true if server responded before timeout, else false
 */

const waitForServer = async (urlStr, timeout = 15000) => {
	const start = Date.now()
	const url = new URL(urlStr)
	const client = url.protocol === 'https:' ? https : http

	const tryOnce = () =>
		new Promise((resolve) => {
			const req = client.request(
				{
					method: 'HEAD',
					hostname: url.hostname,
					port: url.port || (url.protocol === 'https:' ? 443 : 80),
					path: url.pathname || '/',
					timeout: 1000,
				},
				(res) => {
					// Any response indicates the server is up
					res.resume()
					resolve(true)
				}
			)
			req.on('timeout', () => {
				req.destroy(new Error('timeout'))
			})
			req.on('error', () => resolve(false))
			req.end()
		})

	while (Date.now() - start < timeout) {
		const ok = await tryOnce()
		if (ok) return true
		await new Promise((res) => setTimeout(res, 200))
	}
	return false
}

module.exports = { waitForServer }
