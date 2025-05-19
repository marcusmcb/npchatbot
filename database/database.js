const Datastore = require('nedb')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let dbPath, playlistDbPath

if (process.env.DB_PATH) {
	dbPath = process.env.DB_PATH
	playlistDbPath =
		process.env.PLAYLIST_DB_PATH ||
		path.join(path.dirname(dbPath), 'playlists.db')
} else {
	if (process.env.NODE_ENV === 'development') {
		dbPath = path.join(__dirname, '../users.db')
		playlistDbPath = path.join(__dirname, '../playlists.db')
	} else {
		const userDataPath = app.getPath('userData')
		dbPath = path.join(userDataPath, 'users.db')
		playlistDbPath = path.join(userDataPath, 'playlists.db')
		if (!fs.existsSync(dbPath)) {
			fs.copyFileSync(path.join(__dirname, '../users.db'), dbPath)
			console.log(`Database file copied to: ${dbPath}`)
		}
	}
}

const db = {}

db.users = new Datastore({ filename: dbPath, autoload: true })
db.playlists = new Datastore({ filename: playlistDbPath, autoload: true })

module.exports = db
