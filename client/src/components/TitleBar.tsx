import '../App.css'
import SpotifyIcon from './icons/spotify/SpotifyIcon'
import TwitchIcon from './icons/twitch/TwitchIcon'
import { TitleBarProps } from '../types'

const ipcRenderer = window.electron.ipcRenderer

const TitleBar = ({
	isTwitchAuthorized,
	isSpotifyAuthorized,
	isBotConnected,
}: TitleBarProps): JSX.Element => {
	const handleAuthClick = () => {
		if (!isTwitchAuthorized) {
			ipcRenderer.send('open-twitch-auth-url')
		} else {
			console.log('Already authorized')
			// ipcRenderer.send('open-auth-settings', 'https://www.twitch.tv/settings/connections')
			ipcRenderer.send('open-twitch-auth-url')
		}
	}

	const handleSpotifyAuthClick = () => {
		if (!isTwitchAuthorized) {
			ipcRenderer.send('open-spotify-auth-url')
		} else {
			console.log('Already authorized')
			// ipcRenderer.send('open-auth-settings', 'https://www.twitch.tv/settings/connections')
			ipcRenderer.send('open-spotify-auth-url')
		}
	}

	return (
		<div>
			<div className='app-title'>npChatbot</div>
			<div className='auth-button-row'>
				<button
					onClick={handleAuthClick}
					disabled={isBotConnected}
					className={
						isTwitchAuthorized ? 'auth-button-authorized' : 'auth-button-default'
					}
				>
					<span className='button-content'>
						<TwitchIcon size={20} />
						{/* {isTwitchAuthorized ? 'Authorized' : 'Authorize'} */}
					</span>
				</button>
				<button
					onClick={handleSpotifyAuthClick}
					disabled={isBotConnected}
					className={
						isSpotifyAuthorized ? 'auth-button-authorized' : 'auth-button-default'
					}
				>
					<span className='button-content'>
						<SpotifyIcon size={20} />
						{/* {isTwitchAuthorized ? 'Authorized' : 'Authorize'} */}
					</span>
				</button>
			</div>
		</div>
	)
}

export default TitleBar
