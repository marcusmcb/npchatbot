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
				// Do not expose raw tokens or sensitive fields to the renderer.
				const userDataToSubmit = {
					// copy safe fields only; fall back to empty/defaults where appropriate
					_id: user._id,
					twitchChannelName: user.twitchChannelName || '',
					twitchChatbotName: user.twitchChatbotName || '',
					seratoDisplayName: user.seratoDisplayName || '',
					isObsResponseEnabled: !!user.isObsResponseEnabled,
					isIntervalEnabled: !!user.isIntervalEnabled,
					isSpotifyEnabled: !!user.isSpotifyEnabled,
					continueLastPlaylist: !!user.continueLastPlaylist,
					isAutoIDEnabled: !!user.isAutoIDEnabled,
					isAutoIDCleanupEnabled: !!user.isAutoIDCleanupEnabled,
					isReportEnabled: !!user.isReportEnabled,
					intervalMessageDuration: String(user.intervalMessageDuration ?? ''),
					obsClearDisplayTime: String(user.obsClearDisplayTime ?? ''),
					userEmailAddress: user.userEmailAddress || '',
					// Do expose non-sensitive discord webhook metadata if present
					discord: user.discord ? {
						webhook_url: user.discord.webhook_url || null,
						channel_id: user.discord.channel_id || null,
						guild_id: user.discord.guild_id || null,
						webhook_id: user.discord.webhook_id || null,
					} : null,
				}

				const responseObject = {
					success: true,
					data: userDataToSubmit,
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
