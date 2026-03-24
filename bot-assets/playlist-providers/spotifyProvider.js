const { createSpotifyPlaylist } = require('../spotify/createSpotifyPlaylist')
const { getSpotifyPlaylistData } = require('../spotify/getSpotifyPlaylistData')
const { getSpotifySongData } = require('../spotify/getSpotifySongData')
const { addTracksToSpotifyPlaylist } = require('../spotify/addTracksToSpotifyPlaylist')

const { getSpotifyAccessToken } = require('../../auth/spotify/getSpotifyAccessToken')

/**
 * Playlist provider interface (informal / by convention):
 * - id: string
 * - isEnabled(config): boolean
 * - getPlaylistId(config): string | null
 * - ensurePlaylistOnBotStart({ arg, user, event }): Promise<{ success: boolean, message?: string, error?: string } | null>
 * - getPlaylistLength(playlistId): Promise<number>
 * - searchTrackRef(query): Promise<string | null>
 * - addTracksToPlaylist(playlistId, trackRefs, wss): Promise<void>
 */

const spotifyProvider = {
	id: 'spotify',

	isEnabled: (config) => config && config.isSpotifyEnabled === true,

	getPlaylistId: (config) =>
		(config && config.currentSpotifyPlaylistId) || null,

	refreshAccessToken: async () => getSpotifyAccessToken(),

	/**
	 * Mirrors existing behavior in bot-scripts/handleStartBotScript.js.
	 * - Refresh/validate token (getSpotifyAccessToken)
	 * - Create playlist if continueLastPlaylist is NOT enabled
	 * - If continuing, validate existing playlist id and create if invalid
	 */
	ensurePlaylistOnBotStart: async ({ arg, user }) => {
		if (!arg || arg.isSpotifyEnabled !== true) return null

		// If continue Last playlist is NOT enabled, create a new Spotify playlist
		if (!arg.continueLastPlaylist === true) {
			return await createSpotifyPlaylist()
		}

		// Continuing last playlist: validate stored playlist id, create if invalid
		if (user && (user.currentSpotifyPlaylistId !== null || user.currentSpotifyPlaylistId !== undefined)) {
			const spotifyPlaylistData = await getSpotifyPlaylistData(user.currentSpotifyPlaylistId)
			if (spotifyPlaylistData === null || spotifyPlaylistData === undefined || spotifyPlaylistData === 0) {
				return await createSpotifyPlaylist()
			}
			return null
		}

		return await createSpotifyPlaylist()
	},

	getPlaylistLength: async (playlistId) => getSpotifyPlaylistData(playlistId),

	searchTrackRef: async (query) => getSpotifySongData(query),

	addTracksToPlaylist: async (playlistId, trackRefs, wss) =>
		addTracksToSpotifyPlaylist(playlistId, trackRefs, wss),
}

module.exports = spotifyProvider
