import { useEffect } from 'react'

const useGetUserData = (
	setFormData: React.Dispatch<React.SetStateAction<any>>,
	setInitialFormData: React.Dispatch<React.SetStateAction<any>>,
	setInitialPreferences: React.Dispatch<React.SetStateAction<any>>,
	setIsObsResponseEnabled: React.Dispatch<React.SetStateAction<boolean>>,
	setIsIntervalEnabled: React.Dispatch<React.SetStateAction<boolean>>,
	setIsReportEnabled: React.Dispatch<React.SetStateAction<boolean>>,
	setIsSpotifyEnabled: React.Dispatch<React.SetStateAction<boolean>>,
	setIsAutoIDEnabled: React.Dispatch<React.SetStateAction<boolean>>,
	setIsAutoIDCleanupEnabled: React.Dispatch<React.SetStateAction<boolean>>,
	setContinueLastPlaylist: React.Dispatch<React.SetStateAction<boolean>>,
	setIsSpotifyAuthorized: React.Dispatch<React.SetStateAction<boolean>>,
	setIsTwitchAuthorized: React.Dispatch<React.SetStateAction<boolean>>,
	setIsConnectionReady: React.Dispatch<React.SetStateAction<boolean>>,
	addMessageToQueue: (message: string) => void
) => {
	useEffect(() => {
		const ipcRendererInstance = window.electron?.ipcRenderer
		if (ipcRendererInstance) {
			ipcRendererInstance.send('getUserData', {})
			const handleGetUserDataResponse = (response: any) => {
				// console.log('Response: ', response.error)
				if (response.error) {
					addMessageToQueue(
						'To get started, click the Twitch icon to authorize npChatbot.'
					)
				}
				if (response && Object.keys(response.data).length > 0) {
					setFormData(response.data)
					setInitialFormData(response.data) // Save the initial form data
					setInitialPreferences({
						isObsResponseEnabled: response.data.isObsResponseEnabled,
						isIntervalEnabled: response.data.isIntervalEnabled,
						isReportEnabled: response.data.isReportEnabled,
						obsClearDisplayTime: response.data.obsClearDisplayTime,
						intervalMessageDuration: response.data.intervalMessageDuration,
						isSpotifyEnabled: response.data.isSpotifyEnabled,
						isAutoIDEnabled: response.data.isAutoIDEnabled,
						isAutoIDCleanupEnabled: response.data.isAutoIDCleanupEnabled,
						continueLastPlaylist: response.data.continueLastPlaylist,
					})
					setIsObsResponseEnabled(response.data.isObsResponseEnabled)
					setIsIntervalEnabled(response.data.isIntervalEnabled)
					setIsReportEnabled(response.data.isReportEnabled)
					setIsSpotifyEnabled(response.data.isSpotifyEnabled)
					setIsAutoIDEnabled(response.data.isAutoIDEnabled)
					setIsAutoIDCleanupEnabled(response.data.isAutoIDCleanupEnabled)
					setContinueLastPlaylist(response.data.continueLastPlaylist)
					setIsSpotifyAuthorized(!!response.data.spotifyAuthorizationCode)
					setIsTwitchAuthorized(!!response.data.appAuthorizationCode)
					setIsConnectionReady(
						// Check if all necessary fields are filled for connection
						!!response.data.twitchChannelName &&
							!!response.data.twitchChatbotName &&
							!!response.data.seratoDisplayName
					)
				}
			}
			ipcRendererInstance.once('getUserDataResponse', handleGetUserDataResponse)
			return () => {
				ipcRendererInstance.removeAllListeners('getUserDataResponse')
			}
		}
	}, [])
}

export default useGetUserData
