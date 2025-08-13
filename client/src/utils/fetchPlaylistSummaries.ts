const ipcRenderer = window.electron.ipcRenderer

const fetchPlaylistSummaries = async (): Promise<any> => {
	console.log('*** Fetching Playlist Summaries ***')
	return new Promise((resolve) => {
		ipcRenderer.send('get-playlist-summaries')
		ipcRenderer.once('get-playlist-summaries-response', (data: any) => {
			if (data) {
				console.log('Received playlist summaries data:', data)
				resolve(data)			
			} else {
				console.error('No data received for playlist summaries.')
				resolve(null)
				return
			}
			
		})
	})
}

export default fetchPlaylistSummaries
