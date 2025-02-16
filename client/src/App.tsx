import React, { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPanel from './components/SessionPanel'
import MessagePanel from './components/MessagePanel'
import { BotProcessResponse, AuthSuccess } from './types'
import { ReportData } from './types'
import ReportViewer from './components/ReportViewer'
import './App.css'

const App = (): JSX.Element => {
	/* TYPES */

	// interface AuthSuccess {
	// 	_id: string
	// 	twitchRefreshToken: string
	// }

	/* STATE VALUES */

	const [formData, setFormData] = useState({
		_id: '',
		twitchChannelName: '',
		twitchChatbotName: '',
		twitchRefreshToken: '',
		spotifyRefreshToken: '',
		seratoDisplayName: '',
		obsWebsocketAddress: '',
		obsWebsocketPassword: '',
		intervalMessageDuration: '',
		obsClearDisplayTime: '',
		userEmailAddress: '',
		isObsResponseEnabled: false,
		isIntervalEnabled: false,
		isReportEnabled: false,
		isSpotifyEnabled: false,
		isAutoIDEnabled: false,
		isAutoIDCleanupEnabled: false,
	})

	const [error, setError] = useState('')
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [showTooltip, setShowTooltip] = useState<string | null>(null)
	const [isBotConnected, setIsBotConnected] = useState(false)
	const [isTwitchAuthorized, setIsTwitchAuthorized] = useState(false)
	const [isSpotifyAuthorized, setIsSpotifyAuthorized] = useState(false)
	const [isSpotifyEnabled, setIsSpotifyEnabled] = useState(false)
	const [isConnectionReady, setIsConnectionReady] = useState(false)
	const [isAutoIDEnabled, setIsAutoIDEnabled] = useState(false)
	const [isAutoIDCleanupEnabled, setIsAutoIDCleanupEnabled] = useState(false)
	const [messageQueue, setMessageQueue] = useState<string[]>([])
	const [currentMessage, setCurrentMessage] = useState<string | null>(null)
	const [isReportEnabled, setIsReportEnabled] = useState(false)
	const [reportData, setReportData] = useState<ReportData | null>(null)
	const [isReportReady, setIsReportReady] = useState(false)
	const [reportView, setReportView] = useState(false)
	const [initialFormData, setInitialFormData] = useState(formData)
	const [isFormModified, setIsFormModified] = useState(false)
	const [initialPreferences, setInitialPreferences] = useState({
		isObsResponseEnabled,
		isIntervalEnabled,
		isReportEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		obsClearDisplayTime: formData.obsClearDisplayTime,
		intervalMessageDuration: formData.intervalMessageDuration,
	})
	const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const ipcRenderer = window.electron.ipcRenderer

	/* EFFECT HOOKS */

	// hook to load initial user data and preferences
	useEffect(() => {
		const ipcRendererInstance = window.electron?.ipcRenderer
		if (ipcRendererInstance) {
			ipcRendererInstance.send('getUserData', {})
			const handleGetUserDataResponse = (response: any) => {
				console.log('Response: ', response.error)
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
					})
				}
			}
			ipcRendererInstance.once('getUserDataResponse', handleGetUserDataResponse)
			return () => {
				ipcRendererInstance.removeAllListeners('getUserDataResponse')
			}
		}
	}, [])

	// hook to check current form data against initial form data
	useEffect(() => {
		const preferencesModified =
			isObsResponseEnabled !== initialPreferences.isObsResponseEnabled ||
			isIntervalEnabled !== initialPreferences.isIntervalEnabled ||
			isAutoIDEnabled !== initialPreferences.isAutoIDEnabled ||
			isAutoIDCleanupEnabled !== initialPreferences.isAutoIDCleanupEnabled ||
			isReportEnabled !== initialPreferences.isReportEnabled ||
			isSpotifyEnabled !== initialPreferences.isSpotifyEnabled ||
			formData.obsClearDisplayTime !== initialPreferences.obsClearDisplayTime ||
			formData.intervalMessageDuration !==
				initialPreferences.intervalMessageDuration

		const formModified =
			JSON.stringify(formData) !== JSON.stringify(initialFormData)

		setIsFormModified(preferencesModified || formModified)
	}, [
		formData,
		initialFormData,
		isObsResponseEnabled,
		isIntervalEnabled,
		isReportEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		initialPreferences,
	])

	// hook for successful twitch auth callback
	useEffect(() => {
		const socket = new WebSocket('ws://localhost:8080')
		socket.addEventListener('open', () => {
			console.log('WebSocket is open now.')
		})

		socket.addEventListener('message', (event) => {
			console.log('Message from server: ', event.data)
			addMessageToQueue(event.data)
			// if (event.data !== 'npChatbot authorization with Twitch was cancelled.') {
			// 	setIsTwitchAuthorized(true)
			// }
			if (
				event.data === 'npChatbot successfully linked to your Twitch account'
			) {
				console.log('**** Twitch Auth Successful ****')
				setIsTwitchAuthorized(true)
			}
			if (
				event.data === 'npChatbot successfully linked to your Spotify account'
			) {
				console.log('**** Spotify Auth Successful ****')
				setIsSpotifyAuthorized(true)
			}
		})

		socket.addEventListener('error', (event) => {
			console.error('WebSocket error:', event)
		})

		return () => {
			socket.close()
		}
	}, [])

	// hook to initially set user id in state
	// once the app has been authorized via Twitch

	// update hook and back end Electron handler
	// to handle successful auth response from
	// either Twitch or Spotify
	useEffect(() => {
		const handleAuthSuccess = (response: AuthSuccess) => {
			console.log('Auth success:', response)
			setFormData((prevFormData) => ({
				...prevFormData,
				_id: response._id,
				twitchRefreshToken: response.twitchRefreshToken,
			}))
		}
		window.electron.ipcRenderer.on('auth-successful', handleAuthSuccess)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('authSuccess')
		}
	}, [])

	// hook to set user data in client UI on app load
	useEffect(() => {
		const ipcRendererInstance = window.electron?.ipcRenderer
		if (ipcRendererInstance) {
			ipcRendererInstance.send('getUserData', {})
			const handleGetUserDataResponse = (response: any) => {
				if (response && Object.keys(response.data).length > 0) {
					console.log('USER DATA: ')
					console.log(response.data)
					console.log('-------------------------')
					setFormData(response.data)
					setIsObsResponseEnabled(response.data.isObsResponseEnabled)
					setIsIntervalEnabled(response.data.isIntervalEnabled)
					setIsReportEnabled(response.data.isReportEnabled)
					setIsSpotifyEnabled(response.data.isSpotifyEnabled)
					setIsAutoIDEnabled(response.data.isAutoIDEnabled)
					setIsAutoIDCleanupEnabled(response.data.isAutoIDCleanupEnabled)
					setIsSpotifyAuthorized(!!response.data.spotifyAuthorizationCode)
					setIsTwitchAuthorized(!!response.data.appAuthorizationCode)
					setIsConnectionReady(
						// Check if all necessary fields are filled for connection
						!!response.data.twitchChannelName &&
							!!response.data.twitchChatbotName &&
							!!response.data.seratoDisplayName
					)
				} else {
					console.log('NO VALUES STORED')
				}
				console.log('USER DATA: ')
				console.log(response.data)
			}
			ipcRendererInstance.once('getUserDataResponse', handleGetUserDataResponse)
			return () => {
				ipcRendererInstance.removeAllListeners('getUserDataResponse')
			}
		}
	}, [])

	// hook to handle user response messages in the UI via message queue
	useEffect(() => {
		if (messageTimeoutRef.current) {
			clearTimeout(messageTimeoutRef.current)
			messageTimeoutRef.current = null
		}
		if (messageQueue.length > 0 || currentMessage) {
			if (messageQueue.length > 0) {
				const newMessage = messageQueue[0]
				setCurrentMessage(newMessage)
				setMessageQueue((prevQueue) => prevQueue.slice(1))
			}
			messageTimeoutRef.current = setTimeout(() => {
				setCurrentMessage(null)
			}, 5000)
		}
	}, [messageQueue, currentMessage])

	// hook to handle error messages from bot process
	useEffect(() => {
		const handleBotProcessData = (response: BotProcessResponse) => {
			console.log('Data from botProcess:', response)
			addMessageToQueue(response.message)
		}
		window.electron.ipcRenderer.on('botProcessResponse', handleBotProcessData)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('botProcessResponse')
		}
	}, [])

	// hook to handle tooltip visibility
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

	// FOR TESTING ONLY
	// effect hook to check if auth code returned from Twitch in packaged version
	useEffect(() => {
		const handleAuthCode = (response: any) => {
			console.log('Auth code:', response)
		}
		window.electron.ipcRenderer.on('auth-code', handleAuthCode)
		return () => {
			window.electron.ipcRenderer.removeAllListeners('auth-code')
		}
	}, [])

	/* CLIENT UI HELPER METHODS */

	// helper to add user response messages to message queue
	const addMessageToQueue = (newMessage: string) => {
		if (newMessage !== undefined) {
			setMessageQueue((prevQueue) => [...prevQueue, newMessage])
		} else return
	}

	// helper to validate submitted email string
	const isValidEmail = (email: string) => {
		var pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
		return pattern.test(email)
	}

	// method to validate that the user's Serato Live Playlist is public
	// and can be accessed by npChatbot
	const validateLivePlaylist = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		const seratoDisplayName = formData.seratoDisplayName.replaceAll(' ', '_')
		const livePlaylistURL =
			'https://www.serato.com/playlists/' + seratoDisplayName + '/live'
		ipcRenderer.send('validateLivePlaylist', { url: livePlaylistURL })
		ipcRenderer.once('validateLivePlaylistResponse', (response) => {
			if (response && response.isValid) {
				addMessageToQueue(
					'Your Serato Live Playlist is public and ready for use with npChatbot.'
				)
			} else if (response && !response.isValid) {
				setError(
					'Your current Serato Live Playlist cannot be reached. Please ensure your playlist is live and public and try again.'
				)
				setTimeout(() => {
					setError('')
				}, 5000)
			} else if (response && response.error) {
				console.error(response.error)
				addMessageToQueue(response.error)
			} else {
				console.error(
					'Unexpected response format from validateLivePlaylistResponse'
				)
			}
		})
	}

	// handle npChatbot script connection
	const handleConnect = async (event: React.MouseEvent<HTMLButtonElement>) => {
		addMessageToQueue('Connecting to Twitch...')
		console.log('*** sending startBotScript ***')
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
			spotifyRefreshToken: formData.spotifyRefreshToken,
			isSpotifyEnabled: formData.isSpotifyEnabled,
			seratoDisplayName: formData.seratoDisplayName,
		})
		console.log('*** startBotScript sent; awaiting response ***')
		ipcRenderer.on('startBotResponse', (response) => {
			if (response && response.success) {
				console.log('--- successfully startBotResponse ---')
				addMessageToQueue('npChatbot is connected to your Twitch chat')
				setIsBotConnected(true)
			} else if (response && response.error) {
				console.error(response.error)
				addMessageToQueue(response.error)
			} else {
				console.error('Unexpected response format from startBotResponse')
			}
		})
	}

	// handle npChatbot script disconnection
	const handleDisconnect = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		console.log('*** npChatbot disconnect event ***')
		ipcRenderer.send('stopBotScript', {
			seratoDisplayName: formData.seratoDisplayName,
		})
		ipcRenderer.once('stopBotResponse', (response) => {
			if (response && response.success) {
				console.log('Final Report Data: ', response.data)
				setReportData(response.data as ReportData)
				setIsReportReady(true)
				addMessageToQueue('npChatbot has been disconnected')
				setIsBotConnected(false)
			} else if (response && response.error) {
				console.log('Disconnection error: ', response.error)
				addMessageToQueue(response.error)
			} else {
				console.log('Unexpected response from stopBotResponse')
			}
		})
	}

	// handle user input changes
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
	}

	// handle user credentials and preferences submission
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
		}

		ipcRenderer.send('submitUserData', submitData)
		ipcRenderer.once('userDataResponse', (response) => {
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

	return (
		<div className='App'>
			<div className='top-panel'>
				{reportView ? (
					<></>
				) : (
					<>
						<TitleBar
							isTwitchAuthorized={isTwitchAuthorized}
							isSpotifyAuthorized={isSpotifyAuthorized}
							isBotConnected={isBotConnected}
						/>
						<MessagePanel
							message={currentMessage || ''}
							error={error}
							showTooltip={showTooltip}
						/>
					</>
				)}
			</div>
			<div>
				{reportView ? (
					<div className='app-container'>
						<div className='main-report-panel'>
							<ReportViewer
								reportData={reportData}
								setReportView={setReportView}
							/>
						</div>
					</div>
				) : (
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
								isTwitchAuthorized={isTwitchAuthorized}
								isSpotifyAuthorized={isSpotifyAuthorized}
								isFormModified={isFormModified}
							/>
							<PreferencesPanel
								formData={formData}
								isTwitchAuthorized={isTwitchAuthorized}
								isObsResponseEnabled={isObsResponseEnabled}
								isSpotifyEnabled={isSpotifyEnabled}
								isSpotifyAuthorized={isSpotifyAuthorized}
								isAutoIDEnabled={isAutoIDEnabled}
								isAutoIDCleanupEnabled={isAutoIDCleanupEnabled}
								setIsAutoIDEnabled={setIsAutoIDEnabled}
								setIsAutoIDCleanupEnabled={setIsAutoIDCleanupEnabled}
								setIsSpotifyEnabled={setIsSpotifyEnabled}
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
							isTwitchAuthorized={isTwitchAuthorized}
							isConnectionReady={isConnectionReady}
							reportData={reportData || ({} as ReportData)}
							isReportReady={isReportReady}
							setReportView={setReportView}
							reportView={reportView}
							validateLivePlaylist={validateLivePlaylist}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default App
