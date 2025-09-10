// utility ipcMain method to return the user's data
// to the client UI

const fs = require('fs')
const db = require('../../database')

const handleGetUserData = async () => {
	console.log("Handle Get User Data called")
	console.log("-------------------------------")
	if (fs.existsSync(db.users.filename)) {
		try {
			const user = await new Promise((resolve, reject) => {
				db.users.findOne({}, (err, user) => {
					if (err) {
						reject(err)
					} else {
						resolve(user)
					}
				})
			})

			if (user) {
				console.log('User data retrieved')
				console.log("-------------------------------")
				const responseObject = {
					success: true,
					data: user,
				}
				console.log("User Data Sent: ", responseObject)
				console.log("-------------------------------")				
				return responseObject
			} else {
				console.log('No user found in database.')
				const errorObject = {
					success: false,
					error: 'No user found',
				}
				return errorObject
			}
		} catch (error) {
			console.error('Error fetching user data:', error)
			const errorObject = {
				success: false,
				error: 'Error fetching user data',
			}			
			return errorObject
		}
	} else {
		const errorObject = {
			success: false,
			error: 'No user data was found.',
		}
		return errorObject
		
	}
}

module.exports = {
	handleGetUserData,
}
