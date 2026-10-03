import React, { useEffect, useState } from 'react'
import { SessionPanelProps } from '../types'
import { useUserContext } from '../context/UserContext'
import '../App.css'
import './styles/sessionpanel.css'

const SessionPanel: React.FC<SessionPanelProps> = (props) => {
	const [uptimeSeconds, setUptimeSeconds] = useState(0)
	const { isTwitchAuthorized, isConnectionReady, isDiscordAuthorized, formData } =
		useUserContext()
	const twitchChannelName = formData?.twitchChannelName || ''

	useEffect(() => {
		if (!props.isBotConnected) return

		const interval = setInterval(() => {
			setUptimeSeconds((prev) => prev + 1)
		}, 1000)

		return () => {
			clearInterval(interval)
		}
	}, [props.isBotConnected])

	const resetUptime = () => {
		setUptimeSeconds(0)
	}

	const formatUptime = (totalSeconds: number) => {
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60
		const pad = (n: number) => String(n).padStart(2, '0')
		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
	}

	return (
		<>
		<section className='dashboard-card chatbot-controls' aria-labelledby='controls-heading'>
			<h2 className='app-form-title chatbot-controls-title' id='controls-heading'>Chatbot Controls</h2>
			<div className='bot-control-button-panel'>
				<button
					className='bot-control-button default-button'
					type='button'
					onClick={(event) => {
						if (props.isBotConnected) {
							props.handleDisconnect(event)
							setTimeout(resetUptime, 500)
						} else {
							props.handleConnect(event)
						}
					}}
					disabled={!props.isBotConnected && (!isTwitchAuthorized || !isConnectionReady)}
				>
					{props.isBotConnected ? 'Disconnect' : 'Connect'}
				</button>
				<button
					className='bot-control-button default-button'
					type='button'
					onClick={props.validateLivePlaylist}
				>
					Playlist Status
				</button>
			</div>
			{props.isBotConnected && (
				<div className='session-uptime'>Uptime: {formatUptime(uptimeSeconds)}</div>
			)}
		</section>
		<section className='dashboard-card analytics-controls' aria-labelledby='analytics-heading'>
			<h2 className='app-form-title' id='analytics-heading'>Playlist Analytics</h2>
				<button
					className='bot-control-button default-button'
					type='button'
					onClick={async () => {
						try {
							const result = await window.electron.ipcRenderer.invoke(
								'open-playlist-summaries-in-browser',
								{
									playlistSummaries: props.playlistSummaries,
									currentReportIndex: props.currentReportIndex,
									isDiscordAuthorized,
									twitchChannelName,
								}
							)
							if (!result || result.success !== true) {
								console.error(
									'Failed to open playlist summaries in browser:',
									result
								)
							}
						} catch (e) {
							console.error('Failed to open playlist summaries in browser:', e)
						}
					}}
					disabled={!props.isReportReady || props.isBotConnected}
				>
					Search Your Play Histories
				</button>
		</section>
		</>
	)
}

export default SessionPanel
