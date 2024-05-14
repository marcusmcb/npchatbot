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
	const [isConnectionReady, setIsConnectionReady] = useState(false)
	const ipcRenderer = window.electron.ipcRenderer

	// hook for successful twitch auth callback
	useEffect(() => {
		const socket = new WebSocket('ws://localhost:8080')
		socket.addEventListener('open', () => {
			console.log('WebSocket is open now.')
		})

		socket.addEventListener('message', (event) => {
			console.log('Message from server: ', event.data)
			setMessage(event.data)
			setIsAuthorized(true)
			setTimeout(() => {
				setMessage('')
			}, 5000)
		})
		socket.addEventListener('error', (event) => {
			console.error('WebSocket error:', event)
		})
		return () => {
			socket.close()
		}
	}, [])

	useEffect(() => {
		const handleUserDataUpdate = (data: any) => {
			console.log('--- Saved User Data ---')
			console.log(data)
			console.log('-----------------------')
			if (data && Object.keys(data).length > 0) {
				// Update the form data state with the fetched user data
				setFormData(data)
				// Update other relevant state variables based on the fetched data
				setIsObsResponseEnabled(data.isObsResponseEnabled)
				setIsIntervalEnabled(data.isIntervalEnabled)
				setIsReportEnabled(data.isReportEnabled)
				setIsAuthorized(!!data.appAuthorizationCode) // Check if app is authorized
				setIsConnectionReady(
					// Check if all necessary fields are filled for connection
					!!data.twitchChannelName &&
						!!data.twitchChatbotName &&
						!!data.seratoDisplayName
				)
			} else if (data.error) {
				console.log('USER CONFIG ERROR: ')
				console.log(data.error)
			}
		}

		const handleUserDataResponse = (response: any) => {
			console.log('RESPONSE: ', response)
			if (response && response.data) {
				handleUserDataUpdate(response.data)
			} else {
				console.error(
					'getUserDataResponse received invalid data: ',
					response.error
				)
			}
		}

		if (ipcRenderer) {
			const fetchData = () => {
				ipcRenderer.send('getUserData', {})
			}

			ipcRenderer.once('getUserDataResponse', (response) => {
				handleUserDataResponse(response)
			})

			ipcRenderer.on('userDataUpdated', (response) => {
				console.log("--- userDataUpdated called from client ---")
				handleUserDataUpdate(response)
			})			
			// Fetch initial user data
			fetchData()
			console.log("*** fetchData called ***")
			// Cleanup listeners
			return () => {
				ipcRenderer.removeAllListeners('getUserDataResponse')
				ipcRenderer.removeAllListeners('userDataUpdated')
			}
		}
	}, [])

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
		setMessage('')
		setMessage('Connecting to Twitch...')
		console.log("*** sending startBotScript ***")
		ipcRenderer.send('startBotScript', {
			twitchChannelName: formData.twitchChannelName,
			obsWebsocketAddress: formData.obsWebsocketAddress
				? formData.obsWebsocketAddress
				: '',
			obsWebsocketPassword: formData.obsWebsocketPassword
				? formData.obsWebsocketPassword
				: '',
			isObsResponseEnabled: formData.isObsResponseEnabled,
			twitchRefreshToken: formData.twitchRefreshToken,
		})
		console.log("*** startBotScript sent; awaiting response ***")
		ipcRenderer.on('startBotResponse', (response) => {
			if (response && response.success) {
				console.log("--- successfully startBotResponse ---")
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
		console.log('*** npChatbot disconnect event ***')
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
		console.log('--- Form Data Submitted ---')
		console.log(formData)
		console.log('---------------------------')
		if (
			!formData.twitchChannelName ||
			!formData.twitchChatbotName ||
			!formData.seratoDisplayName
		) {
			setError('Please fill in all fields.')
			setTimeout(() => {
				setError('')
			}, 3000)
			return
		}
		setMessage('Updating...')

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

		ipcRenderer.send('submitUserData', submitData)
		ipcRenderer.once('userDataResponse', (response) => {
			if (response && response.success) {
				setMessage('')
				setMessage(response.message)
				setFormData(response.data)
				setIsConnectionReady(true)
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
			<TitleBar isAuthorized={isAuthorized} isBotConnected={isBotConnected} />
			<div className='app-container'>
				<div className='creds-prefs-panel'>
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
						isBotConnected={isBotConnected}
					/>
				</div>
				<SessionPanel
					handleConnect={handleConnect}
					handleDisconnect={handleDisconnect}
					isBotConnected={isBotConnected}
					isAuthorized={isAuthorized}
					isConnectionReady={isConnectionReady}
				/>
			</div>
			<MessagePanel message={message} error={error} showTooltip={showTooltip} />
		</div>
	)
}

export default App
