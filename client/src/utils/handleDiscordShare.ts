const ipcRenderer = window.electron.ipcRenderer

const handleDiscordShare = async (spotifyURL: string, sessionDate?: Date) => {
	console.log('Sharing to Discord...')
	const payload = {
		spotifyURL,
		sessionDate: sessionDate ? sessionDate.toISOString() : null,
	}
	ipcRenderer.send('share-playlist-to-discord', payload)  
}

export default handleDiscordShare
