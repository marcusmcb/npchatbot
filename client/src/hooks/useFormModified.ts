import { useEffect } from 'react'

const useFormModified = (
	formData: any,
	initialFormData: any,
	isObsResponseEnabled: boolean,
	isIntervalEnabled: boolean,
	isReportEnabled: boolean,
	isSpotifyEnabled: boolean,
	isAutoIDEnabled: boolean,
	isAutoIDCleanupEnabled: boolean,
	continueLastPlaylist: boolean,
	initialPreferences: any,
	setIsFormModified: React.Dispatch<React.SetStateAction<boolean>>
) => {
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
		setIsFormModified,
	])
}

export default useFormModified
