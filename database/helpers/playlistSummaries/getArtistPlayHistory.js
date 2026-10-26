const db = require('../../database')

const normalizeOwner = (value) =>
	typeof value === 'string'
		? value.trim().replace(/^#/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').toLowerCase()
		: ''

const getArtistPlayHistory = async (config) => {
	const channel = normalizeOwner(config.twitchChannelName)
	if (!channel) throw new Error('A Twitch channel is required to query artist history.')

	return new Promise((resolve, reject) => {
		db.playlists.find({}, (error, playlists) => {
			if (error) {
				reject(error)
				return
			}
			resolve(playlists.filter((playlist) => {
				const owner = normalizeOwner(playlist.twitch_channel_name)
				if (owner) return owner === channel
				const dj = normalizeOwner(playlist.dj_name)
				if (dj) return dj === normalizeOwner(config.seratoDisplayName)
				// Legacy local histories without an owner belong to this installation.
				return true
			}))
		})
	})
}

module.exports = { getArtistPlayHistory }
