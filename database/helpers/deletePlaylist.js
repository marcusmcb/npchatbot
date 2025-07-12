const db = require('../database')
const logToFile = require('../../scripts/logger')

const deletePlaylist = async (playlistId, event) => {
	return new Promise((resolve, reject) => {
		console.log('Deleting selected playlist with ID:', playlistId)
		db.playlists.remove({ _id: playlistId }, {}, (err, numRemoved) => {
			if (err) {
				logToFile('Error deleting playlist:', err)
				console.error('Error deleting playlist:', err)
				event.reply('deletePlaylistResponse', { success: false, error: err })
				reject(err)
			} else {
				logToFile(`Playlist with ID ${playlistId} successfully deleted`)
				console.log(`Playlist with ID ${playlistId} successfully deleted`)
				event.reply('deletePlaylistResponse', {
					success: true,
					numRemoved: numRemoved,
				})
				resolve({ success: true, numRemoved: numRemoved })
			}
		})
	})
}

module.exports = { deletePlaylist }
