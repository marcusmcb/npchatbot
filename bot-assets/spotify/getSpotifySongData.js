/*

This method requires additional logic to evaluate the songs returned from
Spotify relative to what was searched.  This will require splitting the
songQuery value at the hyphen to determine the artist and title values.

The updated logic should evaluate the title and artist values relative
to the top 3 results returned from Spotify.  The title and artist values 
of each result can be parsed from the response data returned. 

UPDATE:

Currently, npChatbot returns the first result from the Spotify search
as the result to add to the user's playlist. 

Clean the tracks[i].name and tracks[i].artists[0].name values returned
and create a string to compare to the songQuery string submitted.

If the strings match, return the tracks[i].uri value to be added to the
playlist.  

UPDATE: 

If no match is found, then the songQuery submitted may need
to be sent as an object with separate artist and title values to
evaluate against the Spotify results.  Alternately, the comparison
can be submitted again using the 2nd and 3rd results returned.

In the calling method, parse the scraped result from each Serato
song entry as an object with artist and title key/value pairs.

Pass the resulting queryObject into the getSpotifySongData method 
to use in the comparison.  Apply the strict comparison as we are
currently but add in a partial match methodology if the strict
comparison fails.

Apply the partial match logic to the normalized title and artist
values against the normalized Spotify response values.  If a partial
match is found between the combined comparison, then return the
first track uri to use update the playlist.

If the partial match logic fails on the first track returned, then
apply the same logic cycle to the 2nd result returned (and the 3rd
if necessary).  Update on the first strict comparison or partial match
found if the first track result is not useable.


*/

const axios = require('axios')
const {
	checkSpotifyAccessToken,
} = require('../../auth/spotify/checkSpotifyAccessToken')

const {
	cleanCurrentSongInfo,
	cleanQueryString,
} = require('../spotify/helpers/spotifyPlaylistHelpers')

const getSpotifySongData = async (songQuery) => {
	const accessToken = await checkSpotifyAccessToken()
	if (!accessToken) {
		console.error('Cannot submit track search, Spotify authentication failed.')
		return
	}

	console.log('Updated Access Token: ', accessToken)
	
	try {
		const url = `https://api.spotify.com/v1/search?q=${songQuery}&type=track&limit=3&market=USA`
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})
		const tracks = response.data.tracks.items
		// console.log('Spotify Response for: ', songQuery)
		// console.log('-------------------')
		// for (let i = 0; i < tracks.length; i++) {
		// 	console.log('Track ', i + 1)
		// 	console.log(tracks[i].name)
		// 	console.log(tracks[i].artists[0].name)
		// 	console.log('-------------------')
		// }
		const firstTrack = tracks[0]
		const firstTrackString = `${firstTrack.artists[0].name} - ${firstTrack.name}`
		const firstTrackCleaned = cleanCurrentSongInfo(firstTrackString)
		const firstTrackComparison = cleanQueryString(firstTrackCleaned)

		console.log('Song Query: ', songQuery)
		console.log('First Track Returned: ', firstTrackComparison)
		console.log('-------------------')

		return firstTrack.uri

		// const normalizedSongQuery = songQuery.toLowerCase().trim()
		// const normalizedFirstTrack = firstTrackComparison.toLowerCase().trim()

		// if (normalizedSongQuery === normalizedFirstTrack) {
		// 	// console.log('Match found for song query.')
		// 	// console.log('Normalized Song Query: ', normalizedSongQuery)
		// 	// console.log('Normalized First Track: ', normalizedFirstTrack)
		// 	// console.log('-------------------')
		// 	return firstTrack.uri
		// } else {
		// 	console.log('* * * * * * * * * * * *')
		// 	console.log('No match found for song query.')
		// 	console.log('- - - - - - - - - - - - - - -')
		// 	console.log('Normalized Song Query: ', normalizedSongQuery)
		// 	console.log('Normalized First Track: ', normalizedFirstTrack)
		// 	console.log('* * * * * * * * * * * *')
		// 	return null
		// }
	} catch (error) {
		console.error(
			`Error getting song data for "${songQuery}":`,
			error.response?.data || error.message
		)
	}
}

module.exports = { getSpotifySongData }
