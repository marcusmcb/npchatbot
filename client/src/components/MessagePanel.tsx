import tooltipTexts from './tooltips/tooltipTexts'
import { MessagePanelProps } from '../types'
import '../App.css'
import './styles/messagepanel.css'

const MessagePanel: React.FC<MessagePanelProps> = ({
	message,
	error,
	showTooltip,
}) => {
	// Function to get the tooltip content
	const getTooltipContent = (key: string) => {
		switch (key) {
			case 'twitchChannelName':
				return tooltipTexts.twitchChannelName
			case 'twitchChatbotName':
				return tooltipTexts.twitchChatbotName
			case 'obsClearDisplayTime':
				return tooltipTexts.obsClearDisplayTime
			case 'seratoDisplayName':
				return tooltipTexts.seratoDisplayName
			case 'intervalMessageDuration':
				return tooltipTexts.intervalMessageDuration
			case 'obsWebsocketAddress':
				return tooltipTexts.obsWebsocketAddress
			case 'obsWebsocketPassword':
				return tooltipTexts.obsWebsocketPassword
			case 'obsResponseToggle':
				return tooltipTexts.obsResponseToggle
			case 'spotifyPlaylistEnabled':
				return tooltipTexts.spotifyPlaylistEnabled
			case 'autoIDEnabled':
				return tooltipTexts.autoIDEnabled
			case 'autoIDCleanupEnabled':
				return tooltipTexts.autoIDCleanupEnabled
			case 'autoIDDelayEnabled':
				return tooltipTexts.autoIDDelayEnabled
			case 'continueLastPlaylist':
				return tooltipTexts.continueLastPlaylist
			case 'intervalMessageToggle':
				return tooltipTexts.intervalMessageToggle
			default:
				return ''
		}
	}

	if (error) {
		console.log("Error: ", error)
	}

	return (
		<section className='message-panel' aria-labelledby='messages-heading'>
			<h2 className='app-form-title' id='messages-heading'>Messages</h2>
			<div className='message-content' aria-live='polite'>
			{!message && !error && !showTooltip && (
				<div className='welcome-message'>
					<span className='welcome-icon' aria-hidden='true'>i</span>
					<div>
						<strong>Welcome to npChatbot!</strong>
						<p>Connect to begin listening for now playing updates and interacting with your chat.</p>
					</div>
				</div>
			)}
			{message && <div className='success-message'>{message}</div>}
			{error && <div className='error-message'>{error}</div>}
			{showTooltip && (
				<div
					className='info-tooltip'
					dangerouslySetInnerHTML={{ __html: getTooltipContent(showTooltip) }} // Render HTML safely
				/>
			)}
			</div>
		</section>
	)
}

export default MessagePanel
