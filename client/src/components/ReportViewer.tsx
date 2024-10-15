// src/components/ReportViewer.js
import React, { Fragment } from 'react'
import { ReportData } from '../types'
import './styles/reportviewer.css'

interface ReportDataProps {
	reportData: ReportData | null
	setReportView: (value: boolean) => void
}

const ReportViewer: React.FC<ReportDataProps> = ({
	reportData,
	setReportView,
}): JSX.Element => {
	return (
		<Fragment>
			{/* <div className='hr'>
				<hr />
			</div> */}
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
							{reportData?.set_length}
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

					{/* <hr className='horizontal-rule' /> */}

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

					{/* <hr className='horizontal-rule' /> */}
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
