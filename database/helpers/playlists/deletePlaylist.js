const db = require('../../database')
const logToFile = require('../../../scripts/logger')

const deletePlaylist = async (playlistId, event) => {
	const reply = (payload) => {
		try {
			if (event && typeof event.reply === 'function') {
				event.reply('deletePlaylistResponse', payload)
			}
		} catch {}
	}

	return new Promise((resolve, reject) => {
		console.log('Deleting selected playlist with ID:', playlistId)
		db.playlists.remove({ _id: playlistId }, {}, (err, numRemoved) => {
			if (err) {
				logToFile('Error deleting playlist:', err)
				console.error('Error deleting playlist:', err)
				console.log('-----------------------')
				reply({ success: false, error: err })
				reject(err)
				return
			}

			logToFile(`Playlist with ID ${playlistId} successfully deleted`)
			console.log(`Playlist with ID ${playlistId} successfully deleted`)
			console.log('-----------------------')
			reply({
				success: true,
				numRemoved: numRemoved,
			})
			resolve({ success: true, numRemoved: numRemoved })
		})
	})
}

module.exports = { deletePlaylist }
