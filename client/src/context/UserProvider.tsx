import React, { useState } from 'react'
import { UserContext, UserContextType } from './UserContext'

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	// Initial default values (can be replaced with loaded values later)
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
	}

	return (
		<UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
	)
}
