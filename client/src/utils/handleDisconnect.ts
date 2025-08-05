import { ReportData } from '../types'
import fetchPlaylistSummaries from './fetchPlaylistSummaries'

const handleDisconnect = async (
	event: React.MouseEvent<HTMLButtonElement>,
	ipcRenderer: any,
	formData: any,
	setReportData: (data: ReportData | null) => void,
	setIsReportReady: (ready: boolean) => void,
	addMessageToQueue: (message: string) => void,
	setIsBotConnected: (connected: boolean) => void,
	setPlaylistSummaries: (summaries: ReportData[]) => void,
	setCurrentReportIndex: (index: number) => void,
	setError: (error: string) => void
) => {
	console.log('*** npChatbot disconnect event ***')
	ipcRenderer.send('stopBotScript', {
		seratoDisplayName: formData.seratoDisplayName,
	})

	// Await the stopBotResponse before continuing
	const stopBotResult = await new Promise<any>((resolve) => {
		ipcRenderer.once('stopBotResponse', (response: any) => {
			if (response && response.success) {
				addMessageToQueue('npChatbot has been disconnected from Twitch.')
				setIsBotConnected(false)
			} else if (response && response.error) {
				console.log('Disconnection error: ', response.error)
				addMessageToQueue(response.error)
			} else {
				console.log('Unexpected response from stopBotResponse')
			}
			resolve(response)
		})
	})

	console.log('stopBotResponse received:', stopBotResult)

	// Now fetch playlist summaries after stopBotScript has completed
	const playlistSummaries = await fetchPlaylistSummaries(ipcRenderer)
	console.log('Fetched playlist summaries:', playlistSummaries)
	console.log("*****************************************************")
	if (!playlistSummaries || playlistSummaries.length !== 0) {
		setPlaylistSummaries(playlistSummaries)
		setCurrentReportIndex(0)
		setReportData(playlistSummaries[0] as ReportData)
		setIsReportReady(true)
	} else {
		setPlaylistSummaries([])
		setCurrentReportIndex(0)
		setReportData(null)
		setIsReportReady(false)
	}
}

export default handleDisconnect