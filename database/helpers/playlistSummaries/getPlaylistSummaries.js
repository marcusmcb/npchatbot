const db = require('../../database')

const getPlaylistSummaries = async () => {
	return new Promise((resolve, reject) => {		
		db.playlists
			.find({})
			.sort({ session_date: -1 })
			.exec((err, docs) => {
				if (err) {
					console.error('Error fetching playlist summaries:', err)
					reject(err)
				} else {
					console.log('Fetched playlist summaries:', docs.length)
					console.log('--------------------------------')
					resolve(docs)
				}
			})
	})
}
module.exports = { getPlaylistSummaries }
