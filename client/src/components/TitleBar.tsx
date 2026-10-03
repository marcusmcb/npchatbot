import { TitleBarProps } from '../types'
import '../App.css'
import './styles/titlebar.css'

const TitleBar = ({ isBotConnected }: TitleBarProps): JSX.Element => (
	<div className='titlebar'>
		<div className='titlebar-brand'>
			<div className='app-title'>npChatbot</div>
			<div className='app-version'>version 1.1</div>
		</div>
		<div
			className={`titlebar-status ${
				isBotConnected ? 'titlebar-status-connected' : ''
			}`}
			role='status'
		>
			<span className='titlebar-status-dot' />
			{isBotConnected ? 'Connected' : 'Not Connected'}
		</div>
	</div>
)

export default TitleBar
