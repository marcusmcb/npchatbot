const updateUserData = async (db, event, arg) => {	
	event.reply('botProcessResponse', '*** Update user data called ***')
	try {
		const user = await new Promise((resolve, reject) => {
			db.users.findOne({ _id: arg._id }, (err, user) => {
				if (err) {
					reject(err)
				} else {
					resolve(user)
				}
			})
		})

		if (!user) {
			throw new Error('User not found')
		}

		const { getToken: getKeystoreToken } = require('../../helpers/tokens')

		// Read twitch refresh token from keystore if present. Do not persist tokens to DB here.
		try {
			await getKeystoreToken('twitch', user._id)
		} catch (e) {
			// ignore keystore read errors here; token usage happens elsewhere
			console.error('Error reading twitch token from keystore:', e)
		}

		const updatedUser = {
			_id: arg._id,
			// Do not set or persist raw tokens here; keystore is the source of truth for tokens.
			// Persist only non-sensitive metadata.
			twitchChannelName: arg.twitchChannelName,
			twitchChatbotName: arg.twitchChatbotName,
			seratoDisplayName: arg.seratoDisplayName,
			isObsResponseEnabled: arg.isObsResponseEnabled,
			isIntervalEnabled: arg.isIntervalEnabled,
			isSpotifyEnabled: arg.isSpotifyEnabled,
			continueLastPlaylist: arg.continueLastPlaylist,
			isAutoIDEnabled: arg.isAutoIDEnabled,
			isAutoIDCleanupEnabled: arg.isAutoIDCleanupEnabled,
			isReportEnabled: arg.isReportEnabled,
			intervalMessageDuration: arg.intervalMessageDuration,
			obsWebsocketPassword: arg.obsWebsocketPassword,
			obsWebsocketAddress: arg.obsWebsocketAddress,
			obsClearDisplayTime: arg.obsClearDisplayTime,
		}

		await new Promise((resolve, reject) => {
			db.users.update(
				{ _id: arg._id },
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
		// console.log("------------------------")
		// console.log("UPDATED USER: ")
		// console.log(updatedUser)
		// console.log("------------------------")
		console.log('-----------------------------')
		console.log('User data updated successfully')
		console.log('-----------------------------')

		// Sanitize the user object before emitting to renderer or returning from this helper
		const sanitized = {
			_id: updatedUser._id,
			twitchChannelName: updatedUser.twitchChannelName || '',
			twitchChatbotName: updatedUser.twitchChatbotName || '',
			seratoDisplayName: updatedUser.seratoDisplayName || '',
			isObsResponseEnabled: !!updatedUser.isObsResponseEnabled,
			isIntervalEnabled: !!updatedUser.isIntervalEnabled,
			isSpotifyEnabled: !!updatedUser.isSpotifyEnabled,
			continueLastPlaylist: !!updatedUser.continueLastPlaylist,
			isAutoIDEnabled: !!updatedUser.isAutoIDEnabled,
			isAutoIDCleanupEnabled: !!updatedUser.isAutoIDCleanupEnabled,
			isReportEnabled: !!updatedUser.isReportEnabled,
			intervalMessageDuration: String(updatedUser.intervalMessageDuration ?? ''),
			obsClearDisplayTime: String(updatedUser.obsClearDisplayTime ?? ''),
			userEmailAddress: user.userEmailAddress || '',
		}

		event.reply('userDataUpdated', sanitized)

		return {
			success: true,
			message: 'User data successfully updated',
			data: sanitized,
		}
	} catch (error) {
		console.error('Error updating the user:', error)
		return { success: false, error: 'Error updating user' }
	}
}

module.exports = {
	updateUserData: updateUserData,
}
