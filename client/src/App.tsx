import React, { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPanel from './components/SessionPanel'
import MessagePanel from './components/MessagePanel'
import './App.css'

const App = (): JSX.Element => {
	const [formData, setFormData] = useState({
		twitchChannelName: '',
		twitchChatbotName: '',
		twitchRefreshToken: '',		
		seratoDisplayName: '',
		obsWebsocketAddress: '',
		obsWebsocketPassword: '',
		intervalMessageDuration: '',
		obsClearDisplayTime: '',
		userEmailAddress: '',
		isObsResponseEnabled: false,
		isIntervalEnabled: false,
		isReportEnabled: false,
	})

	const [error, setError] = useState('')
	const [message, setMessage] = useState('')
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [isReportEnabled, setIsReportEnabled] = useState(false)
	const [showTooltip, setShowTooltip] = useState<string | null>(null)
	const [isBotConnected, setIsBotConnected] = useState(false)
	const [isAuthorized, setIsAuthorized] = useState(false)
	const ipcRenderer = window.electron.ipcRenderer

	// hook to fetch saved user data
	useEffect(() => {
		if (ipcRenderer) {
			ipcRenderer.send('getUserData', {})
			ipcRenderer.once('getUserDataResponse', (response) => {

				console.log('--- Saved User Data ---')
				console.log(response.data)				
				console.log('-----------------------')

				if (response.data && Object.keys(response.data).length > 0) {
					// if (response.data.twitchAccessToken.length > 0) {
					// 	console.log('-- npChatbot is authorized --')
					// 	setIsAuthorized(true)
					// } else {
					// 	console.log('-- npChatbot has not been authorized --')
					// }
					if (
						response.data.obsWebsocketAddress &&
						response.data.obsWebsocketAddress.startsWith('ws://')
					) {
						response.data.obsWebsocketAddress =
							response.data.obsWebsocketAddress.substring(5)
					}
					console.log("HERE")
					setFormData(response.data)
					setIsObsResponseEnabled(response.data.isObsResponseEnabled)
					setIsIntervalEnabled(response.data.isIntervalEnabled)
					setIsReportEnabled(response.data.isReportEnabled)
				} else if (response.error) {
					console.log('USER CONFIG ERROR: ')
					console.log(response.error)
				}
			})
		}
		return () => {
			ipcRenderer.removeAllListeners('getUserDataResponse')
		}
	}, [])

	useEffect(() => {		
		ipcRenderer.on('auth-successful', (event, url) => {			
			console.log('Authorization was successful', url);			
		});
	}, []);
	

	interface BotProcessResponse {
		success: boolean
		message?: any
		error?: string
	}

	// hook to handle error messages from bot process
	useEffect(() => {
		const handleBotProcessData = (response: BotProcessResponse) => {
			console.log('Data from botProcess:', response)
			setMessage(response.message)
			setTimeout(() => {
				setMessage('')
			}, 4000)
			// Handle the data in your React state or UI as needed
		}
		window.electron.ipcRenderer.on('botProcessResponse', handleBotProcessData)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('botProcessResponse')
		}
	}, [])

	// useEffect(() => {
	// 	setIsObsResponseEnabled(false) // Always reset to false whenever address or password changes
	// }, [formData.obsWebsocketAddress, formData.obsWebsocketPassword])

	useEffect(() => {
		const handleOutsideClick = (event: any) => {
			if (
				showTooltip &&
				!event.target.closest('.question-icon') &&
				!event.target.closest('.info-tooltip')
			) {
				setShowTooltip(null)
			}
		}
		window.addEventListener('click', handleOutsideClick)
		return () => {
			window.removeEventListener('click', handleOutsideClick)
		}
	}, [showTooltip])

	const isValidEmail = (email: string) => {
		var pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
		return pattern.test(email)
	}

	const handleConnect = async (event: React.MouseEvent<HTMLButtonElement>) => {
		console.log('FORM DATA: ')
		console.log(formData)
		setMessage('')
		setMessage('Connecting to Twitch...')
		ipcRenderer.send('startBotScript', {
			twitchChannelName: formData.twitchChannelName,
			obsWebsocketAddress: formData.obsWebsocketAddress
				? formData.obsWebsocketAddress
				: '',
			obsWebsocketPassword: formData.obsWebsocketPassword
				? formData.obsWebsocketPassword
				: '',
			isObsResponseEnabled: formData.isObsResponseEnabled,
			twitchRefreshToken: formData.twitchRefreshToken
		})
		ipcRenderer.once('startBotResponse', (response) => {
			if (response && response.success) {
				setMessage('npChatbot is connected to your Twitch chat')
				setIsBotConnected(true)
			} else if (response && response.error) {
				console.error(response.error)
				setMessage(response.error)
			} else {
				console.error('Unexpected response format from startBotResponse')
			}
			setTimeout(() => {
				setMessage('')
			}, 4000)
		})
	}

	const handleDisconnect = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		console.log('disconnect event')
		ipcRenderer.send('stopBotScript', {})
		ipcRenderer.once('stopBotResponse', (response) => {
			if (response && response.success) {
				setMessage('')
				setMessage('npChatbot has been disconnected')
				setIsBotConnected(false)
			} else if (response && response.error) {
				console.log('Disconnection error: ', response.error)
				setMessage(response.error)
			} else {
				console.log('Unexpected response from stopBotResponse')
			}
			setTimeout(() => {
				setMessage('')
			}, 4000)
		})
	}

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setMessage('Updating...')
		console.log('--- Form Data Submitted ---')
		console.log(formData)
		console.log('---------------------------')
		if (
			!formData.twitchChannelName ||
			!formData.twitchChatbotName ||			
			!formData.seratoDisplayName
		) {
			setError('Please fill in all fields.')
			return
		}
		setError('')

		formData.obsWebsocketAddress = 'ws://' + formData.obsWebsocketAddress

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
		}

		console.log('--- Form Data Submitted ---')
		console.log(submitData)
		console.log('---------------------------')

		ipcRenderer.send('submitUserData', submitData)
		ipcRenderer.once('userDataResponse', (response) => {
			if (response && response.success) {
				if (
					response.data.obsWebsocketAddress &&
					response.data.obsWebsocketAddress.startsWith('ws://')
				) {
					response.data.obsWebsocketAddress =
						response.data.obsWebsocketAddress.substring(5)
				}
				console.log(response)
				setMessage('')
				setMessage(response.message)
				setFormData(response.data)
			} else if (response && response.error) {
				console.log('Update error: ', response.error)
				setMessage('')
				setMessage(response.error)
			} else {
				console.log('Unexpected response when updating preferences')
			}
			setTimeout(() => {
				setMessage('')
			}, 4000)
		})
	}

	return (
		<div className='App'>
			<TitleBar isAuthorized={isAuthorized} />
			<div className='app-container'>
				<CredentialsPanel
					formData={formData}
					handleInputChange={handleInputChange}
					showTooltip={showTooltip}
					setShowTooltip={setShowTooltip}
					handleSubmit={handleSubmit}
					isBotConnected={isBotConnected}
					isObsResponseEnabled={isObsResponseEnabled}
				/>
				<PreferencesPanel
					formData={formData}
					isObsResponseEnabled={isObsResponseEnabled}
					setIsObsResponseEnabled={setIsObsResponseEnabled}
					isIntervalEnabled={isIntervalEnabled}
					setIsIntervalEnabled={setIsIntervalEnabled}
					isReportEnabled={isReportEnabled}
					setIsReportEnabled={setIsReportEnabled}
					handleInputChange={handleInputChange}
					showTooltip={showTooltip}
					setShowTooltip={setShowTooltip}
				/>
				<SessionPanel
					handleConnect={handleConnect}
					handleDisconnect={handleDisconnect}
					isBotConnected={isBotConnected}
				/>
			</div>
			<MessagePanel message={message} error={error} showTooltip={showTooltip} />
		</div>
	)
}

export default App
