const axios = require('axios')

/*

This method requires additional logic to evaluate the songs returned from
Spotify relative to what was searched.  This will require splitting the
songQuery value at the hyphen to determine the artist and title values.

The updated logic should evaluate the title and artist values relative
to the top 3 results returned from Spotify.  The title and artist values 
of each result can be parsed from the response data returned. 

*/

const getSpotifySongData = async (accessToken, songQuery) => {
  try {
    const url = `https://api.spotify.com/v1/search?q=${songQuery}&type=track&limit=3&market=USA`
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const tracks = response.data.tracks.items
    console.log('Spotify Response for: ', songQuery)
    console.log('-------------------')
    for (let i = 0; i < tracks.length; i++) {
      console.log('Track ', i + 1)
      console.log(tracks[i].name)
      console.log(tracks[i].artists[0].name)
      console.log('-------------------')
    }
    const firstTrack = tracks[0]
    return firstTrack ? firstTrack.uri : null
  } catch (error) {
    console.error(
      `Error getting song data for "${songQuery}":`,
      error.response?.data || error.message
    )
  }
}

module.exports = { getSpotifySongData }