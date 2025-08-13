const handleSubmit = async (
	event: React.FormEvent<HTMLFormElement>,
	formData: any,
	ipcRenderer: any,
	addMessageToQueue: (message: string) => void,
  setCurrentMessage: (message: string) => void,
	setError: (error: string) => void,
	setFormData: (data: any) => void,
	setInitialFormData: (data: any) => void,
	setInitialPreferences: (preferences: any) => void,
	setIsFormModified: (modified: boolean) => void,
	setIsConnectionReady: (ready: boolean) => void,
	isReportEnabled: boolean,
	isIntervalEnabled: boolean,
	isObsResponseEnabled: boolean,
	isSpotifyEnabled: boolean,
	isAutoIDEnabled: boolean,
	isAutoIDCleanupEnabled: boolean,
	continueLastPlaylist: boolean,
	isValidEmail: (email: string) => boolean
) => {
	setError('')
	event.preventDefault()
	console.log('--- Form Data Submitted ---')
	console.log(formData)
	console.log('---------------------------')
	if (
		!formData.twitchChannelName ||
		!formData.twitchChatbotName ||
		!formData.seratoDisplayName
	) {
		setError('Please fill in all required fields before updating.')
		setTimeout(() => {
			setError('')
		}, 3000)
		return
	}
	addMessageToQueue('Updating...')
	if (isReportEnabled && formData.userEmailAddress === '') {
		setError('A valid email address is required for post-stream reporting.')
		return
	}
	if (isReportEnabled && !isValidEmail(formData.userEmailAddress)) {
		setError('Please enter a valid email address to enable this feature.')
		return
	}
	if (isIntervalEnabled && formData.intervalMessageDuration === '') {
		formData.intervalMessageDuration = '15'
	}
	if (isObsResponseEnabled && formData.obsClearDisplayTime === '') {
		formData.obsClearDisplayTime = '5'
	}

	const submitData = {
		...formData,
		isObsResponseEnabled,
		isIntervalEnabled,
		isReportEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		continueLastPlaylist,
	}

	ipcRenderer.send('submit-user-data', submitData)
	ipcRenderer.once('userDataResponse', (response: any) => {
		console.log(response)
		if (response && response.success) {
			addMessageToQueue(response.message)
			setFormData(response.data)
			setInitialFormData(response.data)
			setInitialPreferences({
				isObsResponseEnabled: response.data.isObsResponseEnabled,
				isIntervalEnabled: response.data.isIntervalEnabled,
				isReportEnabled: response.data.isReportEnabled,
				isSpotifyEnabled: response.data.isSpotifyEnabled,
				isAutoIDEnabled: response.data.isAutoIDEnabled,
				isAutoIDCleanupEnabled: response.data.isAutoIDCleanupEnabled,
				continueLastPlaylist: response.data.continueLastPlaylist,
				obsClearDisplayTime: response.data.obsClearDisplayTime,
				intervalMessageDuration: response.data.intervalMessageDuration,
			})
			setIsFormModified(false)
			setIsConnectionReady(true)
		} else if (response && response.error) {
			console.log('Update error: ', response.error)
			setCurrentMessage('')
			setError(response.error)
			setTimeout(() => {
				setError('')
			}, 5000)
		} else {
			console.log('Unexpected response when updating preferences')
		}
	})
}

export default handleSubmit
