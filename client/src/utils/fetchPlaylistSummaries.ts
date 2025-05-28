const fetchPlaylistSummaries = async (): Promise<any> => {
	console.log('*** Fetching Playlist Summaries ***')
	return new Promise((resolve) => {
		window.electron.ipcRenderer.once(
			'getPlaylistSummariesResponse',
			(_event, data) => {
				console.log('Playlist Summaries Response: ', data)
				resolve(data)
			}
		)
		window.electron.ipcRenderer.send('getPlaylistSummaries')
	})
}

export default fetchPlaylistSummaries
