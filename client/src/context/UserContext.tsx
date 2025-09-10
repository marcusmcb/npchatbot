import { createContext, useContext } from 'react'

export type UserContextType = {
	// Preferences and state
	isObsResponseEnabled: boolean
	setIsObsResponseEnabled: (v: boolean) => void
	isIntervalEnabled: boolean
	setIsIntervalEnabled: (v: boolean) => void
	isReportEnabled: boolean
	setIsReportEnabled: (v: boolean) => void
	isSpotifyEnabled: boolean
	setIsSpotifyEnabled: (v: boolean) => void
	isAutoIDEnabled: boolean
	setIsAutoIDEnabled: (v: boolean) => void
	isAutoIDCleanupEnabled: boolean
	setIsAutoIDCleanupEnabled: (v: boolean) => void
	continueLastPlaylist: boolean
	setContinueLastPlaylist: (v: boolean) => void
	obsClearDisplayTime: number
	setObsClearDisplayTime: (v: number) => void
	intervalMessageDuration: number
	setIntervalMessageDuration: (v: number) => void
	// Authorizations
	isTwitchAuthorized: boolean
	setIsTwitchAuthorized: (v: boolean) => void
	isSpotifyAuthorized: boolean
	setIsSpotifyAuthorized: (v: boolean) => void
	isDiscordAuthorized: boolean
	setIsDiscordAuthorized: (v: boolean) => void
	// Hydration status
	isUserContextReady: boolean
	// Add more as needed
}

export const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUserContext = () => {
	const ctx = useContext(UserContext)
	if (!ctx) throw new Error('useUserContext must be used within a UserProvider')
	return ctx
}
