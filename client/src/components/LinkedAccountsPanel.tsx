import SpotifyIcon from './icons/spotify/SpotifyIcon'
import TwitchIcon from './icons/twitch/TwitchIcon'
import DiscordIcon from './icons/discord/DiscordIcon'
import { useUserContext } from '../context/UserContext'

const LinkedAccountsPanel = ({ isBotConnected }: { isBotConnected: boolean }) => {
	const { isTwitchAuthorized, isSpotifyAuthorized, isDiscordAuthorized } =
		useUserContext()
	const accounts = [
		{ name: 'Twitch', linked: isTwitchAuthorized, channel: 'open-twitch-auth-url', Icon: TwitchIcon },
		{ name: 'Spotify', linked: isSpotifyAuthorized, channel: 'open-spotify-auth-url', Icon: SpotifyIcon },
		{ name: 'Discord', linked: isDiscordAuthorized, channel: 'open-discord-auth-url', Icon: DiscordIcon },
	]

	return (
		<section className='linked-accounts' aria-labelledby='linked-accounts-heading'>
			<h2 className='app-form-title' id='linked-accounts-heading'>Linked Accounts</h2>
			<div className='linked-account-list'>
				{accounts.map(({ name, linked, channel, Icon }) => (
					<button
						key={name}
						type='button'
						className={`linked-account ${linked ? 'linked-account-authorized' : ''}`}
						disabled={isBotConnected}
						onClick={() => window.electron.ipcRenderer.send(channel)}
						aria-label={`Authorize ${name}: ${linked ? 'Linked' : 'Not linked'}`}
					>
						<Icon size={20} />
						<span className='linked-account-name'>{name}</span>
						<span className='linked-account-state'>
							<span className='linked-account-dot' />
							{linked ? 'Linked' : 'Not linked'}
						</span>
						<span className='linked-account-chevron' aria-hidden='true'>&gt;</span>
					</button>
				))}
			</div>
		</section>
	)
}

export default LinkedAccountsPanel
