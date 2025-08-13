const ipcRenderer = window.electron.ipcRenderer

const handleDiscordShare = async (
  setCurrentDiscordMessage: (message: string | null) => void,
	spotifyURL: string,
	sessionDate?: Date,	
) => {
	console.log('Sharing to Discord...')
	const payload = {
		spotifyURL,
		sessionDate: sessionDate ? sessionDate.toISOString() : null,
	}
	ipcRenderer.send('share-playlist-to-discord', payload)
	ipcRenderer.once('share-playlist-to-discord-response', (response: any) => {
		if (response && response.success) {
			setCurrentDiscordMessage('Successfully Shared')
      setTimeout(() => {
        setCurrentDiscordMessage(null)
      }, 5000)
		}
	})
}

export default handleDiscordShare
