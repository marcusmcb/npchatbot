/**
 * Central helper to retrieve a provider refresh token for a user.
 * Tries OS keystore (keytar) first, then falls back to legacy DB fields when present.
 * Returns the refresh token string or null.
 */

const { getToken } = require('./tokens')

/**
 * Retrieve a provider refresh token for a user.
 * Options:
 *  - poll: boolean (default false) - when true, poll keytar for token appearance for a short period
 *  - timeoutMs: number - total poll timeout in ms (default 800)
 *  - intervalMs: number - poll interval in ms (default 100)
 */

const getRefreshToken = async (provider, user, options = {}) => {
	if (!provider) throw new Error('provider required')
	if (!user) return null

	const { poll = false, timeoutMs = 800, intervalMs = 100 } = options

	try {
		if (user._id) {
			let blob = await getToken(provider, user._id).catch(() => null)
			if (blob && blob.refresh_token) return blob.refresh_token
			if (blob && blob.access_token && provider === 'twitch')
				return blob.access_token

			if (poll) {
				const maxTries = Math.ceil(timeoutMs / intervalMs)
				for (let i = 0; i < maxTries; i++) {
					await new Promise((r) => setTimeout(r, intervalMs))
					blob = await getToken(provider, user._id).catch(() => null)
					if (blob && blob.refresh_token) return blob.refresh_token
					if (blob && blob.access_token && provider === 'twitch')
						return blob.access_token
				}
			}
		}
	} catch (e) {
		// ignore keystore errors and fall back to DB fields
		console.error('Error reading token from keystore:', e)
	}

	// Legacy DB fallbacks (kept for migration/back-compat). Return null if not present.
	if (provider === 'spotify') {
		return (
			user.spotifyRefreshToken ||
			user.spotify_refresh_token ||
			user.refresh_token ||
			null
		)
	}

	if (provider === 'twitch') {
		return user.twitchRefreshToken || null
	}

	if (provider === 'discord') {
		return user.discord && user.discord.refresh_token
			? user.discord.refresh_token
			: null
	}

	return null
}

module.exports = { getRefreshToken }
