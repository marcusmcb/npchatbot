import '../App.css'
import SpotifyIcon from './icons/spotify/SpotifyIcon'
import TwitchIcon from './icons/twitch/TwitchIcon'
import { TitleBarProps } from '../types'

const ipcRenderer = window.electron.ipcRenderer

const TitleBar = ({
	isAuthorized,
	isBotConnected,
}: TitleBarProps): JSX.Element => {

	const handleAuthClick = () => {
		if (!isAuthorized) {
			ipcRenderer.send('open-auth-url')
		} else {
			console.log('Already authorized')
			// ipcRenderer.send('open-auth-settings', 'https://www.twitch.tv/settings/connections')
			ipcRenderer.send('open-auth-url')
		}
	}

	const handleSpotifyAuthClick = () => {
		if (!isAuthorized) {
			ipcRenderer.send('open-auth-url', 'spotify')
		} else {
			console.log('Already authorized')
			// ipcRenderer.send('open-auth-settings', 'https://www.twitch.tv/settings/connections')
			ipcRenderer.send('open-auth-url', 'spotify')
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
						isAuthorized ? 'auth-button-authorized' : 'auth-button-default'
					}
				>
					<span className='button-content'>
						<TwitchIcon size={20} />
						{/* {isAuthorized ? 'Authorized' : 'Authorize'} */}
					</span>
				</button>
				<button
					onClick={() => console.log('Spotify button clicked')}
					disabled={isBotConnected}
					className={
						isAuthorized ? 'auth-button-authorized' : 'auth-button-default'
					}
				>
					<span className='button-content'>
						<SpotifyIcon size={20} />
						{/* {isAuthorized ? 'Authorized' : 'Authorize'} */}
					</span>
				</button>
			</div>
		</div>
	)
}

export default TitleBar
