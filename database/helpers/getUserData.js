const getUserData = async (db) => {
	const user = await new Promise((resolve, reject) => {
		db.users.findOne({}, (err, doc) => {
			if (err) reject(err)
			else resolve(doc)
		})
	})

	if (!user) {
		console.error('No stored user data found.')
		return null
	} else {
		return user
	}
}

module.exports = getUserData