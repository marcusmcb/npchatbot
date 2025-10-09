import React, { useState, useEffect, useMemo, useRef } from 'react'
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
	const [isConnectionReady, setIsConnectionReady] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const isCommittingRef = useRef(false)

	// Form data managed in context
	const [formData, _setFormData] = useState<UserContextType['formData']>({
		_id: '',
		twitchChannelName: '',
		twitchChatbotName: '',
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

	const [initialFormData, setInitialFormData] = useState(formData)
	const [initialPreferences, setInitialPreferences] = useState({
		isObsResponseEnabled,
		isIntervalEnabled,
		isReportEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		continueLastPlaylist,
		obsClearDisplayTime,
		intervalMessageDuration,
	})

	const setFormData: UserContextType['setFormData'] = (patch) => {
		_setFormData((prev) => ({ ...prev, ...patch }))
		// after hydration, any user edit marks dirty (but ignore during commit)
		if (isUserContextReady && !isCommittingRef.current) setHasUnsavedChanges(true)
	}

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
			// hydrate preferences
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

			// hydrate form data (normalize numbers to strings for inputs if needed)
			const hydratedForm: UserContextType['formData'] = {
				_id: userData._id || '',
				twitchChannelName: userData.twitchChannelName || '',
				twitchChatbotName: userData.twitchChatbotName || '',
				seratoDisplayName: userData.seratoDisplayName || '',
				obsWebsocketAddress: userData.obsWebsocketAddress || '',
				obsWebsocketPassword: userData.obsWebsocketPassword || '',
				intervalMessageDuration: String(userData.intervalMessageDuration ?? ''),
				obsClearDisplayTime: String(userData.obsClearDisplayTime ?? ''),
				userEmailAddress: userData.userEmailAddress || '',
				isObsResponseEnabled: !!userData.isObsResponseEnabled,
				isIntervalEnabled: !!userData.isIntervalEnabled,
				isReportEnabled: !!userData.isReportEnabled,
				isSpotifyEnabled: !!userData.isSpotifyEnabled,
				continueLastPlaylist: !!userData.continueLastPlaylist,
				isAutoIDEnabled: !!userData.isAutoIDEnabled,
				isAutoIDCleanupEnabled: !!userData.isAutoIDCleanupEnabled,
			}
			_setFormData(hydratedForm)
			// compute connection ready based on required fields
			const ready =
				!!hydratedForm.twitchChannelName &&
				!!hydratedForm.twitchChatbotName &&
				!!hydratedForm.seratoDisplayName
			setIsConnectionReady(ready)
			setInitialFormData(hydratedForm)
			setInitialPreferences({
				isObsResponseEnabled: !!userData.isObsResponseEnabled,
				isIntervalEnabled: !!userData.isIntervalEnabled,
				isReportEnabled: !!userData.isReportEnabled,
				isSpotifyEnabled: !!userData.isSpotifyEnabled,
				isAutoIDEnabled: !!userData.isAutoIDEnabled,
				isAutoIDCleanupEnabled: !!userData.isAutoIDCleanupEnabled,
				continueLastPlaylist: !!userData.continueLastPlaylist,
				obsClearDisplayTime: Number(userData.obsClearDisplayTime ?? 0),
				intervalMessageDuration: Number(userData.intervalMessageDuration ?? 0),
			})
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

	// Update isConnectionReady when required fields change
	useEffect(() => {
		const ready =
			!!formData.twitchChannelName &&
			!!formData.twitchChatbotName &&
			!!formData.seratoDisplayName
		setIsConnectionReady(ready)
	}, [
		formData.twitchChannelName,
		formData.twitchChatbotName,
		formData.seratoDisplayName,
	])

// No need to listen for connect/disconnect messages; they shouldn't affect dirty state

/* removed effect that listened to connection-state messages (they are sent to main only) */

	// Compute dirty state (structural checks kept for safety, but UI relies on hasUnsavedChanges)
	const isPrefsDirty = useMemo(() => {
		return (
			isObsResponseEnabled !== initialPreferences.isObsResponseEnabled ||
			isIntervalEnabled !== initialPreferences.isIntervalEnabled ||
			isReportEnabled !== initialPreferences.isReportEnabled ||
			isSpotifyEnabled !== initialPreferences.isSpotifyEnabled ||
			isAutoIDEnabled !== initialPreferences.isAutoIDEnabled ||
			isAutoIDCleanupEnabled !== initialPreferences.isAutoIDCleanupEnabled ||
			continueLastPlaylist !== initialPreferences.continueLastPlaylist
		)
	}, [
		isObsResponseEnabled,
		isIntervalEnabled,
		isReportEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		continueLastPlaylist,
		initialPreferences,
	])

	const isFormDirty = useMemo(() => {
		// Only consider user-editable credential fields for dirty-checking
		const editableKeys: Array<keyof UserContextType['formData']> = [
			'twitchChannelName',
			'twitchChatbotName',
			'seratoDisplayName',
			'obsWebsocketAddress',
			'obsWebsocketPassword',
			'intervalMessageDuration',
			'obsClearDisplayTime',
			'userEmailAddress',
		]
		for (const key of editableKeys) {
			if ((formData as any)[key] !== (initialFormData as any)[key]) return true
		}
		return false
	}, [formData, initialFormData])

	const isFormModified = hasUnsavedChanges

	// Debug: log what's causing dirty state
	useEffect(() => {
		const diffs: string[] = []
		if (isPrefsDirty) {
			if (isObsResponseEnabled !== initialPreferences.isObsResponseEnabled)
				diffs.push('pref:isObsResponseEnabled')
			if (isIntervalEnabled !== initialPreferences.isIntervalEnabled)
				diffs.push('pref:isIntervalEnabled')
			if (isReportEnabled !== initialPreferences.isReportEnabled)
				diffs.push('pref:isReportEnabled')
			if (isSpotifyEnabled !== initialPreferences.isSpotifyEnabled)
				diffs.push('pref:isSpotifyEnabled')
			if (isAutoIDEnabled !== initialPreferences.isAutoIDEnabled)
				diffs.push('pref:isAutoIDEnabled')
			if (isAutoIDCleanupEnabled !== initialPreferences.isAutoIDCleanupEnabled)
				diffs.push('pref:isAutoIDCleanupEnabled')
			if (continueLastPlaylist !== initialPreferences.continueLastPlaylist)
				diffs.push('pref:continueLastPlaylist')
		}
		if (isFormDirty) {
			const editableKeys: Array<keyof UserContextType['formData']> = [
				'twitchChannelName',
				'twitchChatbotName',
				'seratoDisplayName',
				'obsWebsocketAddress',
				'obsWebsocketPassword',
				'intervalMessageDuration',
				'obsClearDisplayTime',
				'userEmailAddress',
			]
			for (const k of editableKeys) {
				if ((formData as any)[k] !== (initialFormData as any)[k]) {
					diffs.push(`form:${String(k)}`)
				}
			}
		}
		try {
			window.electron.logToMain?.(
				`[DirtyCheck] modified=${isFormModified} diffs=${diffs.join(',')}`
			)
		} catch {}
		console.debug('[DirtyCheck]', { isFormModified, diffs })
	}, [
		isFormModified,
		isPrefsDirty,
		isFormDirty,
		isObsResponseEnabled,
		isIntervalEnabled,
		isReportEnabled,
		isSpotifyEnabled,
		isAutoIDEnabled,
		isAutoIDCleanupEnabled,
		continueLastPlaylist,
		formData,
		initialFormData,
		initialPreferences,
	])

	const commitInitial: UserContextType['commitInitial'] = (
		nextFormData,
		nextPreferences
	) => {
		isCommittingRef.current = true
		if (nextFormData) {
			// Normalize numeric inputs to strings in snapshot for stable comparisons
			const normalized = {
				...nextFormData,
				intervalMessageDuration: String(
					nextFormData.intervalMessageDuration ?? ''
				),
				obsClearDisplayTime: String(nextFormData.obsClearDisplayTime ?? ''),
			} as UserContextType['formData']
			setInitialFormData(normalized)
		} else {
			setInitialFormData({
				...formData,
				intervalMessageDuration: String(formData.intervalMessageDuration ?? ''),
				obsClearDisplayTime: String(formData.obsClearDisplayTime ?? ''),
			})
		}
		if (nextPreferences) {
			setInitialPreferences(nextPreferences)
			// Align live numeric states with committed snapshot
			setObsClearDisplayTime(nextPreferences.obsClearDisplayTime)
			setIntervalMessageDuration(nextPreferences.intervalMessageDuration)
		} else
			setInitialPreferences({
				isObsResponseEnabled,
				isIntervalEnabled,
				isReportEnabled,
				isSpotifyEnabled,
				isAutoIDEnabled,
				isAutoIDCleanupEnabled,
				continueLastPlaylist,
				obsClearDisplayTime,
				intervalMessageDuration,
			})

		// If we only received formData, update numeric states from it
		if (!nextPreferences && nextFormData) {
			const nextObs = Number(nextFormData.obsClearDisplayTime || 0)
			const nextInterval = Number(nextFormData.intervalMessageDuration || 0)
			setObsClearDisplayTime(nextObs)
			setIntervalMessageDuration(nextInterval)
		}
		// After committing snapshots, clear unsaved flag
		setHasUnsavedChanges(false)
		isCommittingRef.current = false
	}

	// Wrap preference setters to mark dirty after hydration
	const markDirtySetter = (setter: (v: any) => void) => (v: any) => {
		setter(v)
		if (isUserContextReady && !isCommittingRef.current) setHasUnsavedChanges(true)
	}

	const contextValue: UserContextType = {
		isObsResponseEnabled,
		setIsObsResponseEnabled: markDirtySetter(setIsObsResponseEnabled),
		isIntervalEnabled,
		setIsIntervalEnabled: markDirtySetter(setIsIntervalEnabled),
		isReportEnabled,
		setIsReportEnabled: markDirtySetter(setIsReportEnabled),
		isSpotifyEnabled,
		setIsSpotifyEnabled: markDirtySetter(setIsSpotifyEnabled),
		isAutoIDEnabled,
		setIsAutoIDEnabled: markDirtySetter(setIsAutoIDEnabled),
		isAutoIDCleanupEnabled,
		setIsAutoIDCleanupEnabled: markDirtySetter(setIsAutoIDCleanupEnabled),
		continueLastPlaylist,
		setContinueLastPlaylist: markDirtySetter(setContinueLastPlaylist),
		obsClearDisplayTime,
		setObsClearDisplayTime: markDirtySetter(setObsClearDisplayTime),
		intervalMessageDuration,
		setIntervalMessageDuration: markDirtySetter(setIntervalMessageDuration),
		isTwitchAuthorized,
		setIsTwitchAuthorized,
		isSpotifyAuthorized,
		setIsSpotifyAuthorized,
		isDiscordAuthorized,
		setIsDiscordAuthorized,
		isUserContextReady,
		isConnectionReady,
		formData,
		setFormData,
		initialFormData,
		initialPreferences,
		isFormModified,
		commitInitial,
	}

	return (
		<UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
	)
}
