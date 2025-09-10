import React, { useState, useEffect } from 'react'
import { UserContext, UserContextType } from './UserContext'

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	// Initial default values
	const [isObsResponseEnabled, setIsObsResponseEnabled] = useState(false)
	const [isIntervalEnabled, setIsIntervalEnabled] = useState(false)
	const [isReportEnabled, setIsReportEnabled] = useState(false)
	const [isSpotifyEnabled, setIsSpotifyEnabled] = useState(false)
	const [isAutoIDEnabled, setIsAutoIDEnabled] = useState(false)
	const [isAutoIDCleanupEnabled, setIsAutoIDCleanupEnabled] = useState(false)
	const [continueLastPlaylist, setContinueLastPlaylist] = useState(false)
	const [obsClearDisplayTime, setObsClearDisplayTime] = useState(5)
	const [intervalMessageDuration, setIntervalMessageDuration] = useState(15)
	const [isTwitchAuthorized, setIsTwitchAuthorized] = useState(false)
	const [isSpotifyAuthorized, setIsSpotifyAuthorized] = useState(false)
	const [isDiscordAuthorized, setIsDiscordAuthorized] = useState(false)
	const [isUserContextReady, setIsUserContextReady] = useState(false)

	useEffect(() => {
		if (!window.electron || !window.electron.ipcRenderer) {
			console.log('window.electron or ipcRenderer is undefined on initial load')
			try { window.electron?.logToMain?.('[UserProvider] ipcRenderer missing') } catch {}
			return
		}

		const ipcRenderer = window.electron.ipcRenderer
		try { window.electron.logToMain?.('[UserProvider] mounted') } catch {}

		const applyUserData = (response: any) => {
			console.log('User Data Received in Renderer: ', response)
			try { window.electron.logToMain?.(`[UserProvider] received: ${JSON.stringify(response)}`) } catch {}
			if (!response || !response.data) {
				setIsUserContextReady(true)
				return
			}
			const userData = response.data
			if (typeof userData.isObsResponseEnabled === 'boolean')
				setIsObsResponseEnabled(userData.isObsResponseEnabled)
			if (typeof userData.isIntervalEnabled === 'boolean')
				setIsIntervalEnabled(userData.isIntervalEnabled)
			if (typeof userData.isReportEnabled === 'boolean')
				setIsReportEnabled(userData.isReportEnabled)
			if (typeof userData.isSpotifyEnabled === 'boolean')
				setIsSpotifyEnabled(userData.isSpotifyEnabled)
			if (typeof userData.isAutoIDEnabled === 'boolean')
				setIsAutoIDEnabled(userData.isAutoIDEnabled)
			if (typeof userData.isAutoIDCleanupEnabled === 'boolean')
				setIsAutoIDCleanupEnabled(userData.isAutoIDCleanupEnabled)
			if (typeof userData.continueLastPlaylist === 'boolean')
				setContinueLastPlaylist(userData.continueLastPlaylist)
			if (
				typeof userData.obsClearDisplayTime === 'number' ||
				typeof userData.obsClearDisplayTime === 'string'
			)
				setObsClearDisplayTime(Number(userData.obsClearDisplayTime))
			if (
				typeof userData.intervalMessageDuration === 'number' ||
				typeof userData.intervalMessageDuration === 'string'
			)
				setIntervalMessageDuration(Number(userData.intervalMessageDuration))
			if (typeof userData.appAuthorizationCode === 'string')
				setIsTwitchAuthorized(!!userData.appAuthorizationCode)
			if (typeof userData.spotifyAuthorizationCode === 'string')
				setIsSpotifyAuthorized(!!userData.spotifyAuthorizationCode)
			if (typeof userData.discord === 'object') setIsDiscordAuthorized(true)
			setIsUserContextReady(true)
		}

		// Prefer invoke for request/response to avoid race conditions
		Promise.resolve()
			.then(async () => {
				if (ipcRenderer.invoke) {
					console.log('Requesting User Data via invoke')
					try { window.electron.logToMain?.('[UserProvider] requesting via invoke') } catch {}
					const response = await ipcRenderer.invoke('get-user-data', {})
					applyUserData(response)
					return true
				}
				return false
			})
			.catch(() => false)
			.then((usedInvoke) => {
				// Fallback to send/on if invoke not available
				if (!usedInvoke) {
					console.log('Requesting User Data via send/on fallback')
					try { window.electron.logToMain?.('[UserProvider] requesting via send/on') } catch {}
					const handler = (response: any) => {
						applyUserData(response)
					}
					ipcRenderer.once('getUserDataResponse', handler)
					ipcRenderer.send('get-user-data', {})
				}
			})

		return () => {
			ipcRenderer.removeAllListeners('getUserDataResponse')
		}
	}, [])

	const contextValue: UserContextType = {
		isObsResponseEnabled,
		setIsObsResponseEnabled,
		isIntervalEnabled,
		setIsIntervalEnabled,
		isReportEnabled,
		setIsReportEnabled,
		isSpotifyEnabled,
		setIsSpotifyEnabled,
		isAutoIDEnabled,
		setIsAutoIDEnabled,
		isAutoIDCleanupEnabled,
		setIsAutoIDCleanupEnabled,
		continueLastPlaylist,
		setContinueLastPlaylist,
		obsClearDisplayTime,
		setObsClearDisplayTime,
		intervalMessageDuration,
		setIntervalMessageDuration,
		isTwitchAuthorized,
		setIsTwitchAuthorized,
		isSpotifyAuthorized,
		setIsSpotifyAuthorized,
		isDiscordAuthorized,
		setIsDiscordAuthorized,
		isUserContextReady,
	}

	return (
		<UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
	)
}
