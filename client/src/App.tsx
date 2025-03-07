import React, { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar'
import CredentialsPanel from './components/CredentialsPanel'
import PreferencesPanel from './components/PreferencesPanel'
import SessionPanel from './components/SessionPanel'
import MessagePanel from './components/MessagePanel'
import { BotProcessResponse, AuthSuccess } from './types'
import { ReportData } from './types'
import ReportViewer from './components/ReportViewer'
import handleConnect from './utils/handleConnect'
import handleDisconnect from './utils/handleDisconnect'
import handleSubmit from './utils/handleSubmit'
import validateLivePlaylist from './utils/validateLivePlaylist'
import useWebSocket from './hooks/useWebSocket'
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
		continueLastPlaylist: false,
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
	const [continueLastPlaylist, setContinueLastPlaylist] = useState(false)
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
		continueLastPlaylist,
		obsClearDisplayTime: formData.obsClearDisplayTime,
		intervalMessageDuration: formData.intervalMessageDuration,
	})
	const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const ipcRenderer = window.electron.ipcRenderer

	/* EFFECT HOOKS */

	// hook for successful twitch auth callback
	useWebSocket(
		'ws://localhost:8080',
		(event) => {
			console.log('Message from server: ', event.data)
			addMessageToQueue(event.data)
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
		},
		() => {
			console.log('WebSocket is open now.')
		},
		(event) => {
			console.error('WebSocket error:', event)
		}
	)

	// hook to listen for Spotify update messages
	useWebSocket(
		'ws://localhost:8081',
		(event) => {
			console.log('Spotify Message from server: ', event.data)
			addMessageToQueue(event.data)
		},
		() => {
			console.log('Spotify WebSocket is open now.')
		},
		(event) => {
			console.error('Spotify WebSocket error:', event)
		}
	)

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

	// hook to check current form data against initial form data
	useEffect(() => {
		const preferencesModified =
			isObsResponseEnabled !== initialPreferences.isObsResponseEnabled ||
			isIntervalEnabled !== initialPreferences.isIntervalEnabled ||
			isAutoIDEnabled !== initialPreferences.isAutoIDEnabled ||
			isAutoIDCleanupEnabled !== initialPreferences.isAutoIDCleanupEnabled ||
			isReportEnabled !== initialPreferences.isReportEnabled ||
			isSpotifyEnabled !== initialPreferences.isSpotifyEnabled ||
			continueLastPlaylist !== initialPreferences.continueLastPlaylist ||
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
		continueLastPlaylist,
		initialPreferences,
	])

	// hook to initially set user id in state
	// once the app has been authorized via Twitch
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

	// handle user input changes
	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
	}

	// method to validate that the user's Serato Live Playlist
	// is public and can be accessed by npChatbot
	const validateLivePlaylistWrapper = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		validateLivePlaylist(
			event,
			formData,
			ipcRenderer,
			addMessageToQueue,
			setError
		)
	}

	// handle npChatbot script connection
	const handleConnectWrapper = async (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		handleConnect(
			event,
			formData,
			ipcRenderer,
			addMessageToQueue,
			setIsBotConnected,
			setError
		)
	}

	// handle npChatbot script disconnection
	const handleDisconnectWrapper = (
		event: React.MouseEvent<HTMLButtonElement>
	) => {
		handleDisconnect(
			event,
			ipcRenderer,
			formData,
			setReportData,
			setIsReportReady,
			addMessageToQueue,
			setIsBotConnected,
			setError
		)
	}

	// handle user credentials and preferences submission
	const handleSubmitWrapper = async (
		event: React.FormEvent<HTMLFormElement>
	) => {
		handleSubmit(
			event,
			formData,
			ipcRenderer,
			addMessageToQueue,
			setCurrentMessage,
			setError,
			setFormData,
			setInitialFormData,
			setInitialPreferences,
			setIsFormModified,
			setIsConnectionReady,
			isReportEnabled,
			isIntervalEnabled,
			isObsResponseEnabled,
			isSpotifyEnabled,
			isAutoIDEnabled,
			isAutoIDCleanupEnabled,
			continueLastPlaylist,
			isValidEmail
		)
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
								handleSubmit={handleSubmitWrapper}
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
								continueLastPlaylist={continueLastPlaylist}
								setContinueLastPlaylist={setContinueLastPlaylist}
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
							handleConnect={handleConnectWrapper}
							handleDisconnect={handleDisconnectWrapper}
							isBotConnected={isBotConnected}
							isTwitchAuthorized={isTwitchAuthorized}
							isConnectionReady={isConnectionReady}
							reportData={reportData || ({} as ReportData)}
							isReportReady={isReportReady}
							setReportView={setReportView}
							reportView={reportView}
							validateLivePlaylist={validateLivePlaylistWrapper}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default App
