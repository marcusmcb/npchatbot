// add logic to handle any errors returned
// during the Twitch IRC connection process
// in the client UI

// add logic to handle any disconnection
// events after initial connection
// in the client UI

import React, { useState, useEffect } from 'react'
import { SessionPanelProps } from '../types'
import { useUserContext } from '../context/UserContext'
import '../App.css'
import './styles/sessionpanel.css'

const ipcRenderer = window.electron.ipcRenderer

const SessionPanel: React.FC<SessionPanelProps> = (props) => {
	const [uptimeSeconds, setUptimeSeconds] = useState(0)
	const { isTwitchAuthorized, isConnectionReady } = useUserContext()

	useEffect(() => {
		let interval: NodeJS.Timeout

		if (props.isBotConnected) {
			ipcRenderer.send('update-connection-state', true)
			interval = setInterval(() => {
				setUptimeSeconds((prev) => prev + 1)
			}, 1000)
		} else {
			ipcRenderer.send('update-connection-status', false)
		}

		return () => {
			if (interval) {
				clearInterval(interval)
			}
		}
	}, [props.isBotConnected])

	const resetUptime = () => {
		setUptimeSeconds(0)
	}

	const formatUptime = (totalSeconds: number) => {
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
				.toString()
				.padStart(2, '0')}`
		} else {
			return `${minutes}:${seconds.toString().padStart(2, '0')}`
		}
	}

	return (
		<div className='chatbot-controls'>
			<div className='app-form-title'>Chatbot Controls:</div>
			<div className='bot-control-button-panel'>
				<button
					className={
						props.isBotConnected
							? 'bot-control-button default-button greyed-out-on-connect'
							: 'bot-control-button default-button'
					}
					type='submit'
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
					type='submit'
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
					onClick={props.validateLivePlaylist}
				>
					Playlist Status
				</button>
				{props.isReportReady && (
					<button
						className='bot-control-button default-button'
						onClick={() => {
							props.setReportView(true)
						}}
						disabled={props.isBotConnected}
					>
						View Summary
					</button>
				)}
			</div>
			<div className='app-form-title session-info'>Session Info:</div>
			<div className='session-info-label'>
				Status:
				<span className='session-info-status'>
					{props.isBotConnected ? (
						<span style={{ color: 'lightgreen' }}>connected</span>
					) : (
						<span>not connected</span>
					)}
				</span>
			</div>
			<div className='session-info-label'>
				Uptime:
				<span className='session-info-status' style={{ color: 'lightgreen' }}>
					{uptimeSeconds === 0 ? '' : formatUptime(uptimeSeconds)}
				</span>
			</div>
		</div>
	)
}

export default SessionPanel
