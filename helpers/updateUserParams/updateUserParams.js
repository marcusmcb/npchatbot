const updateUserData = async (db, event, arg) => {
	console.log("------------------------")
	console.log("*** UPDATE USER DATA ***")
	console.log(arg)
	console.log("------------------------")
	return new Promise((resolve, reject) => {
		db.users.findOne({}, async (err, existingUser) => {
			if (err) {
				console.error('Error fetching the user:', err)
				return reject({ error: 'ipcMain: no user found' })
			}

			if (!existingUser) {
				console.log(
					'No existing user found. Inserting new user or handling error.'
				)
				// Handle inserting a new user or returning an error here
				return resolve({ error: 'No existing user found.' })
			}

			const updatedUser = { ...existingUser }
			Object.keys(arg).forEach((key) => {
				if (arg[key] !== existingUser[key]) {
					updatedUser[key] = arg[key]
				}
			})

			console.log("--------------------")
			console.log("UPDATED USER: ")
			console.log(updatedUser)
			console.log("--------------------")

			try {
				const numReplaced = await new Promise((resolve, reject) => {
					db.users.update(
						{ _id: existingUser._id },
						{ $set: updatedUser },
						{},
						(err, numReplaced) => {
							if (err) {
								reject(err)
							} else {
								resolve(numReplaced)
							}
						}
					)
				})

				console.log(`Updated ${numReplaced} user(s) with new data.`)
				resolve({ success: true, message: 'User data successfully updated', data: updatedUser })
			} catch (error) {
				console.error('Error updating the user:', error)
				reject({ success: false, error: 'Error updating user' })
			}
		})
	})
}

module.exports = {
	updateUserData: updateUserData,
}
