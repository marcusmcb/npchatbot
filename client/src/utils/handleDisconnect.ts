import { ReportData } from '../types'

const handleDisconnect = (
    event: React.MouseEvent<HTMLButtonElement>,
    ipcRenderer: any,
    formData: any,
    setReportData: (data: ReportData | null) => void,
    setIsReportReady: (ready: boolean) => void,
    addMessageToQueue: (message: string) => void,
    setIsBotConnected: (connected: boolean) => void,
    setError: (error: string) => void
) => {
    console.log('*** npChatbot disconnect event ***')
    ipcRenderer.send('stopBotScript', {
        seratoDisplayName: formData.seratoDisplayName,
    })
    ipcRenderer.once('stopBotResponse', (response: any) => {
        if (response && response.success) {
            console.log('Final Report Data: ', response.data)
            setReportData(response.data as ReportData)
            setIsReportReady(true)
            addMessageToQueue('npChatbot has been disconnected from Twitch.')
            setIsBotConnected(false)
        } else if (response && response.error) {
            console.log('Disconnection error: ', response.error)
            addMessageToQueue(response.error)
        } else {
            console.log('Unexpected response from stopBotResponse')
        }
    })
}

export default handleDisconnect