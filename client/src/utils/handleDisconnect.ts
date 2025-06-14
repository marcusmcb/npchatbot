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
	console.log('Current Playlist Summary: ', playlistSummaries[0])
	setPlaylistSummaries(playlistSummaries)
	setCurrentReportIndex(0)
	setReportData(playlistSummaries[0] as ReportData)
	setIsReportReady(true)
}

export default handleDisconnect

// import { ReportData } from '../types'
// import fetchPlaylistSummaries from './fetchPlaylistSummaries'

// const handleDisconnect = async (
// 	event: React.MouseEvent<HTMLButtonElement>,
// 	ipcRenderer: any,
// 	formData: any,
// 	setReportData: (data: ReportData | null) => void,
// 	setIsReportReady: (ready: boolean) => void,
// 	addMessageToQueue: (message: string) => void,
// 	setIsBotConnected: (connected: boolean) => void,
// 	setError: (error: string) => void
// ) => {
// 	console.log('*** npChatbot disconnect event ***')
// 	ipcRenderer.send('stopBotScript', {
// 		seratoDisplayName: formData.seratoDisplayName,
// 	})
// 	ipcRenderer.once('stopBotResponse', (response: any) => {
// 		if (response && response.success) {
// 			// console.log('Final Report Data: ', response.data)
// 			// setReportData(response.data as ReportData)
// 			// setIsReportReady(true)

// 			addMessageToQueue('npChatbot has been disconnected from Twitch.')
// 			setIsBotConnected(false)
// 		} else if (response && response.error) {
// 			console.log('Disconnection error: ', response.error)
// 			addMessageToQueue(response.error)
// 		} else {
// 			console.log('Unexpected response from stopBotResponse')
// 		}
// 	})
// 	const playlistSummary = await fetchPlaylistSummaries()
// 	console.log('Playlist Summary: ', playlistSummary)
// }

// export default handleDisconnect
