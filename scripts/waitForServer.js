const fetch = (...args) => import('node-fetch').then((mod) => mod.default(...args))

/**
 * Polls the given URL until it responds or the timeout elapses.
 * @param {string} url - The URL to check for readiness
 * @param {number} [timeout=15000] - Timeout in milliseconds
 * @returns {Promise<boolean>} true if server responded before timeout, else false
 */
async function waitForServer(url, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      await fetch(url)
      return true
    } catch {
      await new Promise((res) => setTimeout(res, 300))
    }
  }
  return false
}

module.exports = { waitForServer }
