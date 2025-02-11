import '../App.css'

type PreferencesPanelProps = {
	formData: {
		twitchChannelName: string
		twitchChatbotName: string
		seratoDisplayName: string
		obsWebsocketAddress?: string
		obsWebsocketPassword?: string
		obsClearDisplayTime: string
		intervalMessageDuration: string
		userEmailAddress: string
	}
	isObsResponseEnabled: boolean
	isTwitchAuthorized: boolean
	setIsObsResponseEnabled: (value: boolean) => void
	isIntervalEnabled: boolean
	setIsIntervalEnabled: (value: boolean) => void
	isReportEnabled: boolean
	setIsReportEnabled: (value: boolean) => void
	isSpotifyEnabled: boolean
	setIsSpotifyEnabled: (value: boolean) => void
	isAutoIDEnabled: boolean
	setIsAutoIDEnabled: (value: boolean) => void
	isAutoIDCleanupEnabled: boolean
	setIsAutoIDCleanupEnabled: (value: boolean) => void
	isSpotifyAuthorized: boolean
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	isBotConnected: boolean
}

const PreferencesPanel: React.FC<PreferencesPanelProps> = (props) => {
	return (
		<div className='app-container-column'>
			<div className='app-form-title'>Preferences:</div>

			{/* Spotify Preferences */}
			<div className='toggle-field spotify-prefs-element'>
				<input
					type='checkbox'
					disabled={!props.isSpotifyAuthorized || props.isBotConnected}
					id='spotifyPlaylistEnabled'
					checked={props.isSpotifyEnabled}
					onChange={() => props.setIsSpotifyEnabled(!props.isSpotifyEnabled)}
					className={
						!props.isSpotifyAuthorized || props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>

				<label
					htmlFor='spotifyPlaylistEnabled'
					className={
						(!props.isSpotifyEnabled || props.isBotConnected
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable Spotify Playlist
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

			{/* OBS preferences */}
			<div className='toggle-field obs-prefs-element'>
				<input
					type='checkbox'
					id='obsResponseToggle'
					checked={props.isObsResponseEnabled}
					disabled={!props.isTwitchAuthorized || !props.formData.obsWebsocketAddress || props.isBotConnected}
					onChange={() => {
						props.setIsObsResponseEnabled(!props.isObsResponseEnabled)
					}}
					className={
						!props.isTwitchAuthorized || !props.formData.obsWebsocketAddress || props.isBotConnected
							? 'disabled-toggle'
							: ''
					}
				/>
				<label
					htmlFor='obsResponseToggle'
					className={
						(!props.isObsResponseEnabled || props.isBotConnected
							? 'disabled-label'
							: '') + (props.isBotConnected ? ' greyed-out-label' : '')
					}
				>
					Enable On-Screen OBS Responses
				</label>
			</div>

			<div className='form-field'>
				<label
					htmlFor='obs-clear-display-time'
					className={
						!props.isObsResponseEnabled || props.isBotConnected
							? 'disabled-label'
							: ''
					}
				>
					Display time (in seconds):
				</label>

				<input
					className={
						!props.isObsResponseEnabled || props.isBotConnected
							? 'pref-input disabled-label'
							: 'pref-input'
					}
					type='text'
					id='obs-clear-display-time'
					name='obsClearDisplayTime'
					value={props.formData.obsClearDisplayTime}
					onChange={props.handleInputChange}
					// placeholder='enter time in seconds'
					disabled={!props.isObsResponseEnabled}
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
					disabled={!props.isTwitchAuthorized || props.isBotConnected}
					id='intervalMessageToggle'
					checked={props.isIntervalEnabled}
					onChange={() => props.setIsIntervalEnabled(!props.isIntervalEnabled)}
					className={!props.isTwitchAuthorized || props.isBotConnected ? 'disabled-toggle' : ''}
				/>

				<label
					htmlFor='intervalMessageToggle'
					className={
						(!props.isIntervalEnabled || props.isBotConnected
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
						!props.isIntervalEnabled || props.isBotConnected
							? 'disabled-label'
							: ''
					}
				>
					Interval duration:
				</label>

				<input
					className={
						!props.isIntervalEnabled || props.isBotConnected
							? 'disabled-label pref-input'
							: 'pref-input'
					}
					type='text'
					id='obs-interval-duration'
					name='intervalMessageDuration'
					value={props.formData.intervalMessageDuration}
					onChange={props.handleInputChange}
					// placeholder='enter time in minutes'
					disabled={!props.isIntervalEnabled || props.isBotConnected}
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
