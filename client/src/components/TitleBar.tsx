import '../App.css'

const ipcRenderer = window.electron.ipcRenderer

interface TitleBarProps {
	isAuthorized: boolean
	isBotConnected: boolean
}

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
					isAuthorized ? 'auth-button-authorized default-button' : 'auth-button-default default-button'
				}
			>
				{isAuthorized ? 'Authorized' : 'Authorize'}
			</button>
		</div>
	)
}

export default TitleBar
