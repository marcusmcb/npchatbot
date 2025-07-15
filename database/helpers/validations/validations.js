const axios = require('axios')

// helper method to validate Serato live playlist URL
const seratoURLValidityCheck = async (seratoDisplayName) => {
	const url = `https://www.serato.com/playlists/${seratoDisplayName}`
	try {
		const response = await axios.head(url)
		if (response.status >= 200 && response.status < 300) {
			console.log('Serato URL found')
			return true
		} else {
			console.log('Serato URL not found')
			return false
		}
	} catch (error) {
		if (error.response && error.response.status === 404) {
			console.log('Serato URL not found')
			return false
		} else {
			console.log('Error checking Serato URL: ', error.message)
			return false
		}
	}
}

// helper method to validate Twitch URL
const twitchURLValidityCheck = async (twitchDisplayName, token) => {
	const url = `https://api.twitch.tv/helix/users?login=${twitchDisplayName}`
	try {
		const response = await axios.get(url, {
			headers: {
				'Client-Id': process.env.TWITCH_CLIENT_ID,
				Authorization: 'Bearer ' + token.access_token,
			},
		})
		if (response.data.data.length > 0) {
			console.log('Twitch user page exists.')
			return true
		} else {
			console.log('Twitch user page does not exist.')
			return false
		}
	} catch (error) {
		console.error('Error checking Twitch channel by content:', error)
		// add error message to response and return it
		return false
	}
}

module.exports = {
	seratoURLValidityCheck: seratoURLValidityCheck,
	twitchURLValidityCheck: twitchURLValidityCheck,
}
