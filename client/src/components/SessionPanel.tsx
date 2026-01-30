import React, { useEffect, useState } from 'react'
import { SessionPanelProps } from '../types'
import { useUserContext } from '../context/UserContext'
import '../App.css'
import './styles/sessionpanel.css'

const SessionPanel: React.FC<SessionPanelProps> = (props) => {
	const [uptimeSeconds, setUptimeSeconds] = useState(0)
	const { isTwitchAuthorized, isConnectionReady } = useUserContext()

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
		<div className='chatbot-controls'>
			<div className='app-form-title chatbot-controls-title'>Chatbot Controls:</div>
			<div className='bot-control-button-panel'>
				<button
					className={
						props.isBotConnected
							? 'bot-control-button default-button greyed-out-on-connect'
							: 'bot-control-button default-button'
					}
					type='button'
					onClick={props.handleConnect}
					disabled={
						props.isBotConnected || !isTwitchAuthorized || !isConnectionReady
					}
				>
					{!props.isBotConnected ? 'Connect' : 'Connected'}
				</button>
				<button
					className='bot-control-button default-button'
					disabled={!props.isBotConnected}
					type='button'
					onClick={(event) => {
						props.handleDisconnect(event)
						setTimeout(() => {
							resetUptime()
						}, 500)
					}}
				>
					Disconnect
				</button>
				<button
					className='bot-control-button default-button'
					type='button'
					onClick={props.validateLivePlaylist}
				>
					Playlist Status
				</button>
				<button
					className='bot-control-button default-button'
					type='button'
					onClick={() => {
						props.setReportView(true)
					}}
					disabled={!props.isReportReady || props.isBotConnected}
				>
					View Summary
				</button>
			</div>
			<div className='session-info-bottom'>
				<div className='session-info-heading-bottom'>Session Info</div>
				<div className='session-info-inline'>
					<span className='session-info-label-inline'>Status:</span>
					<span className='session-info-status'>
						{props.isBotConnected ? (
							<span style={{ color: 'lightgreen' }}>connected</span>
						) : (
							<span>not connected</span>
						)}
					</span>
					<span className='session-info-label-inline'>Uptime:</span>
					<span className='session-info-status' style={{ color: 'lightgreen' }}>
						{uptimeSeconds === 0 ? '' : formatUptime(uptimeSeconds)}
					</span>
				</div>
			</div>
		</div>
	)
}

export default SessionPanel
