import SpotifyIcon from './icons/spotify/SpotifyIcon'
import TwitchIcon from './icons/twitch/TwitchIcon'
import DiscordIcon from './icons/discord/DiscordIcon'
import { TitleBarProps } from '../types'
import { useUserContext } from '../context/UserContext'
import '../App.css'
import './styles/titlebar.css'

const ipcRenderer = window.electron.ipcRenderer

const TitleBar = ({ isBotConnected }: TitleBarProps): JSX.Element => {
	const {
		isTwitchAuthorized,
		isSpotifyAuthorized,
		isDiscordAuthorized,
	} = useUserContext()
	
	const handleAuthClick = () => {
		if (!isTwitchAuthorized) {
			ipcRenderer.send('open-twitch-auth-url')
		} else {
			console.log('Already authorized with Twitch')
			// ipcRenderer.send('open-auth-settings', 'https://www.twitch.tv/settings/connections')
			ipcRenderer.send('open-twitch-auth-url')
		}
	}

	const handleSpotifyAuthClick = () => {
		// additional logic for Twitch authorization needed here?
		if (!isSpotifyAuthorized) {
			ipcRenderer.send('open-spotify-auth-url')
		} else {
			console.log('Already authorized with Spotify')
			// ipcRenderer.send('open-auth-settings', 'https://www.twitch.tv/settings/connections')
			ipcRenderer.send('open-spotify-auth-url')
		}
	}

	const handleDiscordAuthClick = () => {
		if (!isDiscordAuthorized) {
			ipcRenderer.send('open-discord-auth-url')
		} else {
			console.log('Already authorized with Discord')
			ipcRenderer.send('open-discord-auth-url')
		}
	}

	return (
		<div>
			<div className='app-title'>npChatbot</div>
			<div className='app-version'>version 1.1</div>
			{/* <div className='auth-button-labels'>Authorizations</div> */}
			<div className='auth-button-row'>
				<button
					onClick={handleAuthClick}
					disabled={isBotConnected}
					className={
						isTwitchAuthorized
							? 'auth-button-authorized'
							: 'auth-button-default'
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
						isSpotifyAuthorized
							? 'auth-button-authorized'
							: 'auth-button-default'
					}
				>
					<span className='button-content'>
						<SpotifyIcon size={20} />
						{/* {isTwitchAuthorized ? 'Authorized' : 'Authorize'} */}
					</span>
				</button>
				<button
					onClick={handleDiscordAuthClick}
					disabled={isBotConnected}
					className={
						isDiscordAuthorized
							? 'auth-button-authorized'
							: 'auth-button-default'
					}
				>
					<span className='button-content'>
						<DiscordIcon size={20} />
					</span>
				</button>
				<div className='auth-button-label'>Linked Accounts</div>
			</div>
		</div>
	)
}

export default TitleBar
