import React, { Fragment } from 'react'
import { ReportData } from '../types'
import './styles/reportviewer.css'

interface ReportDataProps {
	reportData: ReportData | null
	setReportView: (value: boolean) => void
}

// helper method to format the set length string
const formatSetLength = (
	hours: number,
	minutes: number,
	seconds: number
): string => {
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

const ReportViewer: React.FC<ReportDataProps> = ({
	reportData,
	setReportView,
}): JSX.Element => {
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
						<div className='report-panel-item'>
							You began this DJ set at{' '}
							<span className='foo'>{reportData?.set_start_time}</span>.
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>
							Your DJ set was <span className='foo'>{formattedSetLength}</span>{' '}
							in length.
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>
							You played a total of{' '}
							<span className='foo'>{reportData?.total_tracks_played}</span>{' '}
							tracks in this set.
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>
							The average track length was{' '}
							<span className='foo'>{reportData?.average_track_length}</span>{' '}
							for this set.
						</div>
					</div>
				</div>
				{/* REPORT PANEL RIGHT */}
				<div className='report-panel-right'>
					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Longest Songs Played:{' '}
						</div>
						<div>
							{reportData?.top_three_longest.map((longest, index) => (
								<div key={index}>
									<div className='report-panel-item-detail'>
										* {longest.name}{' '}
										<span className='report-panel-item-detail-caption'>
											({longest.length})
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Shortest Songs Played:{' '}
						</div>
						<div>
							{reportData?.top_three_shortest.map((shortest, index) => (
								<div key={index}>
									<div className='report-panel-item-detail'>
										* {shortest.name}{' '}
										<span className='report-panel-item-detail-caption'>
											({shortest.length})
										</span>
									</div>
								</div>
							))}
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
					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Songs Queried:{' '}<span className='doubles-length'>
								{reportData?.np_songs_queried.length}
							</span>							
						</div>
						<div className='report-panel-item-detail'>
							{reportData?.np_songs_queried.map((song, index) => (
								<div className='doubles-text' key={index}>
									* {song.name}
								</div>
							))}
						</div>
					</div>
					<div className='report-panel-group'>
						<div className='report-panel-item-header'>
							Terms Searched:{' '}<span className='doubles-length'>
								{reportData?.dyp_search_terms.length}
							</span>							
						</div>
						<div className='report-panel-item-detail'>
							{reportData?.dyp_search_terms.map((song, index) => (
								<div className='doubles-text' key={index}>
									"{song.name}"
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			<button
				className='report-close-button default-button'
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
