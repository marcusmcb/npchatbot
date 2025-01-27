const dotenv = require('dotenv')
const axios = require('axios')
dotenv.config()

const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const cleanSongTitle = (title) => {
	return title.replace(/\s*[\(\[].*?[\)\]]/g, '').trim()
}

const getAccessToken = async () => {
	try {
		const response = await axios.post(
			'https://accounts.spotify.com/api/token',
			null,
			{
				params: {
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
					client_id: clientId,
					client_secret: clientSecret,
				},
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		)
		console.log('TOKEN RESPONSE: ', response.data.access_token)
		return response.data.access_token
	} catch (error) {
		console.error('Error refreshing access token:', error.response.data)
	}
}

const getSpotifySongData = async (accessToken, songsPlayed) => {
	const cleanedSongs = songsPlayed.map(cleanSongTitle)
	console.log('SONG QUERIED: ')
	console.log(cleanedSongs[0])
	console.log('-------------------')
	try {
		const response = await axios.get(
			`https://api.spotify.com/v1/search?q=${encodeURIComponent(
				cleanedSongs[0]
			)}&type=track&limit=10`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
			}
		)
		console.log('SONG DATA: ', response.data.tracks.items[0])
	} catch (error) {
		console.error('Error getting song data:', error.response.data)
	}
}

const generateSpotifyPlaylistLink = async (reportData) => {
	const accessToken = await getAccessToken()
	let songsPlayed = []
	reportData.track_log.forEach((track) => {
		songsPlayed.push(track.trackId)
	})
	await getSpotifySongData(accessToken, songsPlayed).then((data) =>
		console.log(data)
	)
}

module.exports = generateSpotifyPlaylistLink
