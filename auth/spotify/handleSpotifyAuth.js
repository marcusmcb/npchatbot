const { BrowserWindow } = require('electron')
const { URL } = require('url')
const { generateRandomState } = require('../../auth/helpers/generateRandomState')
const { initSpotifyAuthToken } = require('../../auth/spotify/createSpotifyAccessToken')
const { setSpotifyUserId } = require('../../auth/spotify/setSpotifyUserId')

let spotifyAuthWindow
let spotifyAuthCode
let spotifyAuthError

const handleSpotifyAuth = async (event, arg, mainWindow, wss) => {
    const spotifyClientId = process.env.SPOTIFY_CLIENT_ID
    const spotifyRedirectUri = process.env.SPOTIFY_REDIRECT_URI
    const scope = 'playlist-modify-public playlist-modify-private'
    const state = generateRandomState()
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyClientId}&scope=${scope}&state=${state}&redirect_uri=${spotifyRedirectUri}`

    console.log('SPOTIFY AUTH URL: ')
    console.log(spotifyAuthUrl)
    console.log('--------------------------------------')

    spotifyAuthWindow = new BrowserWindow({
        width: 800,
        height: 830,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    spotifyAuthWindow.loadURL(spotifyAuthUrl)

    spotifyAuthWindow.webContents.on('will-navigate', async (event, url) => {
        spotifyAuthError = false
        console.log('URL:', url)
        const urlObj = new URL(url)
        const code = urlObj.searchParams.get('code')
        const error = urlObj.searchParams.get('error')
        const state = urlObj.searchParams.get('state')
        if (code) {
            console.log('CODE: ', code)
            if (state) {
                console.log('STATE: ', state)
            } else {
                console.log('NO STATE PARAMETER RETURNED')
            }
            spotifyAuthCode = code
            spotifyAuthWindow.close()
        } else if (error) {
            console.log('ERROR: ', error)
            spotifyAuthError = true
            spotifyAuthWindow.close()
        }
    })

    spotifyAuthWindow.on('closed', async () => {
        mainWindow.webContents.send('auth-code', {
            auth_code_on_close: spotifyAuthCode,
        })
        console.log('AUTHCODE ON CLOSE: ', spotifyAuthCode)
        if (spotifyAuthError) {
            console.log('NO AUTH CODE RETURNED: ', spotifyAuthError)
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('npChatbot authorization with Spotify was cancelled.')
                }
            })
            spotifyAuthWindow = null
        } else if (spotifyAuthCode !== undefined) {
            console.log('AUTH CODE: ', spotifyAuthCode)
            await initSpotifyAuthToken(spotifyAuthCode, wss, mainWindow)
            setTimeout(async () => {
                await setSpotifyUserId()
            }, 100)
            spotifyAuthWindow = null
        }
    })
}

module.exports = {
    handleSpotifyAuth,
}