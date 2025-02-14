const axios = require('axios')

const getSpotifyPlaylistUris = async (accessToken, playlistId) => {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const playlistUris = response.data.items.map((item) => item.track.uri)
    console.log(`Playlist URIs: ${playlistUris}`)
    return playlistUris
  } catch (error) {
    console.error(
      `Error getting playlist URIs:`,
      error.response?.data || error.message
    )
    return
  }
}

module.exports = { getSpotifyPlaylistUris }