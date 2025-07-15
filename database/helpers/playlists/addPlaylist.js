const db = require('../../database')
const logToFile = require('../../../scripts/logger')

const addPlaylist = async (playlistData) => {
	return new Promise((resolve, reject) => {
		db.playlists.insert(playlistData, (err, newDoc) => {
			if (err) {
				logToFile('Error adding playlist:', err)
				console.error('Error adding playlist:', err)
        console.log("-----------------------")
				reject(err)
			} else {
				logToFile(`Playlist added successfully with ID: ${newDoc._id}`)
				console.log(`Playlist added successfully with ID: ${newDoc._id}`)
        console.log("-----------------------")
				resolve(newDoc)
			}
		})
	})
}

module.exports = { addPlaylist }
