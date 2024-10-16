import React, { Fragment } from 'react'
import { ReportData } from '../types'
import './styles/reportviewer.css'

interface ReportDataProps {
	reportData: ReportData | null
	setReportView: (value: boolean) => void
}

// Helper function to format the set length
const formatSetLength = (hours: number, minutes: number, seconds: number): string => {
	const parts: string[] = []

	if (hours > 0) {
		parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
	}

	if (minutes > 0) {
		parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
	}

	if (seconds > 0) {
		parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`)
	}

	return parts.length > 0 ? parts.join(', ') : '0 seconds'
}

const ReportViewer: React.FC<ReportDataProps> = ({ reportData, setReportView }): JSX.Element => {
	// Use the helper function to format the set length based on the report data
	const formattedSetLength = reportData
		? formatSetLength(
				reportData.set_length_hours,
				reportData.set_length_minutes,
				reportData.set_length_seconds
		  )
		: ''

	return (
		<Fragment>
			<div className='report-panel'>
				{/* REPORT PANEL LEFT */}
				<div className='report-panel-left'>
					<div className='report-title'>
						npChatbot Stats for{' '}
						<span className='report-dj-name'>{reportData?.dj_name}</span>
					</div>
					<div className='report-subtitle'>{reportData?.playlist_date}</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Set Start Time: </div>
						<div className='report-panel-item-span'>
							{reportData?.set_start_time}
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Set Length: </div>
						<div className='report-panel-item-span'>
							{formattedSetLength}
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Tracks Played: </div>
						<div className='report-panel-item-span'>
							{reportData?.total_tracks_played}
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Average Track Length: </div>
						<div className='report-panel-item-span'>
							{reportData?.average_track_length}
						</div>
					</div>
				</div>
				{/* REPORT PANEL RIGHT */}
				<div className='report-panel-right'>
					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Longest Song Played:{' '}
						</div>
						<div className='report-panel-item-detail'>
							{reportData?.longest_track_name}{' '}
						</div>
						<div className='report-panel-item-detail-caption'>
							({reportData?.longest_track_length})
						</div>
					</div>

					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Shortest Song Played:{' '}
						</div>
						<div className='report-panel-item-detail'>
							{reportData?.shortest_track_name}{' '}
						</div>
						<div className='report-panel-item-detail-caption'>
							({reportData?.shortest_track_length})
						</div>
					</div>

					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Doubles Detected:{' '}
							<span className='doubles-length'>
								{reportData?.doubles_played.length}
							</span>
						</div>
						<div className='report-panel-item-detail'>
							{reportData?.doubles_played.map((double, index) => (
								<div className='doubles-text' key={index}>
									* {double.name}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			<button
				className='report-close-button'
				onClick={() => {
					console.log(reportData)
					setReportView(false)
				}}
			>
				Close
			</button>
		</Fragment>
	)
}

export default ReportViewer
