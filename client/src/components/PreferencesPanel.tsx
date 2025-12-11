/*

add option in the preferences UI for the user to
- enter in their own Spotify playlist title
- use the default ("Twitch Stream Playlist - Date")
- use their current Twitch stream title

add option to resume last Spotify playlist on startup
- if npChatbot has been disconnected, restarted, crashed, etc

*/

import '../App.css'
import './styles/preferencespanel.css'
import { useUserContext } from '../context/UserContext'

type PreferencesPanelProps = {
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	isBotConnected: boolean
}

const PreferencesPanel: React.FC<PreferencesPanelProps> = (props) => {
	const {
		// form
		formData,
		setFormData,
		// auth
		isTwitchAuthorized,
		isSpotifyAuthorized,
		// prefs
		isSpotifyEnabled,
		setIsSpotifyEnabled,
		continueLastPlaylist,
		setContinueLastPlaylist,
		isAutoIDEnabled,
		setIsAutoIDEnabled,
		isAutoIDCleanupEnabled,
		setIsAutoIDCleanupEnabled,
		isObsResponseEnabled,
		setIsObsResponseEnabled,
		isIntervalEnabled,
		setIsIntervalEnabled,
		isReportEnabled,
		setIsReportEnabled,
	} = useUserContext()

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData({ [name]: value } as any)
	}
	return (
		<div className='app-container-column'>
			<div className='app-form-title'>Preferences:</div>

			{/* Spotify Preferences */}
			<div className='toggle-field spotify-prefs-element'>
				<input
					type='checkbox'
					disabled={!isSpotifyAuthorized || props.isBotConnected}
					id='spotifyPlaylistEnabled'
					checked={isSpotifyEnabled}
					onChange={() => setIsSpotifyEnabled(!isSpotifyEnabled)}
					className={
						!isSpotifyAuthorized || props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>

				<label
					htmlFor='spotifyPlaylistEnabled'
					className={
						(!isSpotifyEnabled || props.isBotConnected
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Spotify© Playlist
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'spotifyPlaylistEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'spotifyPlaylistEnabled'
								? null
								: 'spotifyPlaylistEnabled'
						)
					}
				>
					?
				</span>
			</div>

			{/* Continue Last Playlist */}
			<div className='toggle-field'>
				<input
					type='checkbox'
					disabled={
						!isSpotifyAuthorized ||
						!isSpotifyEnabled ||
						props.isBotConnected
					}
					id='spotifyPlaylistEnabled'
					checked={continueLastPlaylist}
					onChange={() => setContinueLastPlaylist(!continueLastPlaylist)}
					className={
						!isSpotifyAuthorized ||
						!isSpotifyEnabled ||
						props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>

				<label
					htmlFor='continueLastPlaylist'
					className={
						(!isSpotifyAuthorized ||
						!isSpotifyEnabled ||
						props.isBotConnected
							? 'disabled-label'
							: '') +
						(!isSpotifyEnabled || props.isBotConnected
							? ' greyed-out-label'
							: '')
					}
				>
					Continue Last Playlist
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'continueLastPlaylist' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'continueLastPlaylist'
								? null
								: 'continueLastPlaylist'
						)
					}
				>
					?
				</span>
			</div>

			{/* Auto ID Preferences */}
			<div className='toggle-field'>
				<input
					type='checkbox'
					disabled={!isTwitchAuthorized || props.isBotConnected}
					id='autoIDEnabled'
					checked={isAutoIDEnabled}
					onChange={() => {
						setIsAutoIDEnabled(!isAutoIDEnabled)
						// if (props.isAutoIDCleanupEnabled) {
						// 	props.setIsAutoIDCleanupEnabled(false)
						// }
					}}
					className={
						!isTwitchAuthorized || props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>

				<label
					htmlFor='autoIDEnabled'
					className={
						(!isAutoIDEnabled || props.isBotConnected
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Auto ID
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'autoIDEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'autoIDEnabled' ? null : 'autoIDEnabled'
						)
					}
				>
					?
				</span>
			</div>

			{/* Auto ID Cleanup Preferences */}
			<div className='toggle-field'>
				<input
					type='checkbox'
					disabled={
						!isTwitchAuthorized ||
						!isAutoIDEnabled ||
						props.isBotConnected
					}
					id='autoIDCleanupEnabled'
					checked={isAutoIDCleanupEnabled}
					onChange={() => setIsAutoIDCleanupEnabled(!isAutoIDCleanupEnabled)}
					className={
						!isTwitchAuthorized ||
						!isAutoIDEnabled ||
						props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>

				<label
					htmlFor='autoIDCleanupEnabled'
					className={
						(!isAutoIDEnabled ||
						!isAutoIDCleanupEnabled ||
						props.isBotConnected
							? 'disabled-label'
							: '') +
						(props.isBotConnected || !isAutoIDEnabled
							? ' greyed-out-label'
							: '')
					}
				>
					Enable Auto ID Cleanup
				</label>
				<span
					className={`question-icon ${
						props.showTooltip === 'autoIDCleanupEnabled' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'autoIDCleanupEnabled'
								? null
								: 'autoIDCleanupEnabled'
						)
					}
				>
					?
				</span>
			</div>

			{/* OBS preferences */}
			<div className='toggle-field obs-prefs-element'>
				<input
					type='checkbox'
					id='obsResponseToggle'
					checked={isObsResponseEnabled}
					disabled={
						!isTwitchAuthorized ||
						!formData.obsWebsocketAddress ||
						props.isBotConnected
					}
					onChange={() => {
						setIsObsResponseEnabled(!isObsResponseEnabled)
					}}
					className={
						!isTwitchAuthorized ||
						!formData.obsWebsocketAddress ||
						props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>
				<label
					htmlFor='obsResponseToggle'
					className={
						(!isObsResponseEnabled || props.isBotConnected
							? 'disabled-label'
							: '') +
						(!isObsResponseEnabled || props.isBotConnected
							? 'greyed-out-label'
							: '')
					}
				>
					Enable OBS Responses
				</label>
			</div>

			<div className='form-field'>
				<label
					htmlFor='obs-clear-display-time'
					className={
						!isObsResponseEnabled || props.isBotConnected
							? 'disabled-label'
							: ''
					}
				>
					Display time (in seconds):
				</label>

				<input
					className={
						!isObsResponseEnabled || props.isBotConnected
							? 'pref-input disabled-label'
							: 'pref-input'
					}
					type='text'
					id='obs-clear-display-time'
					name='obsClearDisplayTime'
					value={formData.obsClearDisplayTime}
					onChange={handleInputChange}
					// placeholder='enter time in seconds'
					disabled={!isObsResponseEnabled}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'obsClearDisplayTime' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'obsClearDisplayTime'
								? null
								: 'obsClearDisplayTime'
						)
					}
				>
					?
				</span>
			</div>

			{/* Interval Message preferences */}
			<div className='toggle-field interval-prefs-element'>
				<input
					type='checkbox'
					disabled={!isTwitchAuthorized || props.isBotConnected}
					id='intervalMessageToggle'
					checked={isIntervalEnabled}
					onChange={() => setIsIntervalEnabled(!isIntervalEnabled)}
					className={
						!isTwitchAuthorized || props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>

				<label
					htmlFor='intervalMessageToggle'
					className={
						(!isIntervalEnabled || props.isBotConnected
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Interval Messages
				</label>
			</div>
			<div className='form-field'>
				<label
					htmlFor='obs-interval-duration'
					className={
						!isIntervalEnabled || props.isBotConnected
							? 'disabled-label'
							: ''
					}
				>
					Duration (in seconds):
				</label>

				<input
					className={
						!isIntervalEnabled || props.isBotConnected
							? 'disabled-label pref-input'
							: 'pref-input'
					}
					type='text'
					id='obs-interval-duration'
					name='intervalMessageDuration'
					value={formData.intervalMessageDuration}
					onChange={handleInputChange}
					// placeholder='enter time in minutes'
					disabled={!isIntervalEnabled || props.isBotConnected}
				/>
				<span
					className={`question-icon ${
						props.showTooltip === 'intervalMessageDuration' ? 'active-icon' : ''
					}`}
					onClick={() =>
						props.setShowTooltip(
							props.showTooltip === 'intervalMessageDuration'
								? null
								: 'intervalMessageDuration'
						)
					}
				>
					?
				</span>
			</div>
		</div>
	)
}

export default PreferencesPanel
