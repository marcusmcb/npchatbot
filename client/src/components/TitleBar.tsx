import '../App.css'
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

	return (
		<div>
			<div className='app-title'>npChatbot</div>
			<button
				onClick={handleAuthClick}
				disabled={isBotConnected}
				className={
					isAuthorized ? 'auth-button-authorized' : 'auth-button-default'
				}
			>
				{isAuthorized ? 'Authorized' : 'Authorize'}
			</button>
		</div>
	)
}

export default TitleBar
