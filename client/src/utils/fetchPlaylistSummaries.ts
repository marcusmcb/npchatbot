const fetchPlaylistSummaries = async (ipcRenderer: any): Promise<any> => {
	console.log('*** Fetching Playlist Summaries ***')
	return new Promise((resolve) => {
		ipcRenderer.send('getPlaylistSummaries')
		ipcRenderer.once('playlistSummariesResponse', (data: any) => {
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
