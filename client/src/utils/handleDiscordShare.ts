const ipcRenderer = window.electron.ipcRenderer

const handleDiscordShare = async (spotifyURL: string) => {
	console.log('Sharing to Discord...')
  ipcRenderer.send('share-playlist-to-discord', spotifyURL)
}

export default handleDiscordShare
