import React, { Fragment } from 'react'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { ReportData, ReportDataProps } from '../types'
import './styles/reportviewer.css'

// add logic in the return to account for the first use case where
// the user has the application installed but has yet to generate
// any play histories

interface ReportViewerProps extends ReportDataProps {
	playlistSummaries: ReportData[]
	currentReportIndex: number
	setCurrentReportIndex: (idx: number) => void
}

// helper method to format the set length string
const formatSetLength = (hours: number, minutes: number): string => {
	const parts: string[] = []
	if (hours > 0) {
		parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
	}
	if (minutes > 0) {
		parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
	}

	return parts.length > 0 ? parts.join(', ') : '0 seconds'
}

const ReportViewer: React.FC<ReportViewerProps> = ({
	reportData,
	setReportView,
	playlistSummaries,
	currentReportIndex,
	setCurrentReportIndex,
}): JSX.Element => {
	const formattedSetLength = reportData
		? formatSetLength(
				reportData.set_length_hours,
				reportData.set_length_minutes
		  )
		: ''

	const handleLeftArrowClick = () => {
		console.log('Left arrow clicked')
		if (currentReportIndex < playlistSummaries.length - 1) {
			setCurrentReportIndex(currentReportIndex + 1)
		}
	}

	const handleRightArrowClick = () => {
		console.log('Right arrow clicked')
		if (currentReportIndex > 0) {
			setCurrentReportIndex(currentReportIndex - 1)
		}
	}

	return (
		<Fragment>
			<div className='report-panel'>
				{/* REPORT PANEL LEFT */}
				<div className='report-panel-left'>
					<div className='report-title'>
						npChatbot Stats for{' '}
						<span className='report-dj-name'>{reportData?.dj_name}</span>
					</div>
					<div className='report-date-selector'>
						<button
							className='report-date-selector-arrow'
							onClick={handleLeftArrowClick}
							aria-label='Previous report'
							type='button'
						>
							<MdArrowBack size={16} />
						</button>
						<div className='report-subtitle'>{reportData?.playlist_date}</div>
						<button
							className='report-date-selector-arrow'
							onClick={handleRightArrowClick}
							aria-label='Next report'
							type='button'
						>
							<MdArrowForward size={16} />
						</button>
					</div>
					<hr
						style={{
							marginRight: '10%',
						}}
					/>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Set Start Time:</div>
						<div className='report-panel-item'>
							<span className='foo'>{reportData?.set_start_time}</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Set Length:</div>
						<div className='report-panel-item'>
							<span className='foo'>{formattedSetLength}</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Total Tracks Played:</div>
						<div className='report-panel-item'>
							<span className='foo'>{reportData?.total_tracks_played}</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Average Track Length:</div>
						<div className='report-panel-item'>
							<span className='foo'>
								{reportData?.average_track_length_minutes} minutes,{' '}
								{reportData?.average_track_length_seconds} seconds
							</span>
						</div>
					</div>

					<div className='report-panel-group-left'>
						<div className='report-panel-group'>
							{/* <div className='reportpanel-item-header'>
								Longest Song Played:{' '}
							</div>
							<div className='report-panel-item-detail'>
								{reportData?.longest_track_name}{' '}
								<span className='report-panel-item-detail-caption'>
									({reportData?.longest_track_length})
								</span>
							</div> */}
							{/* <div>
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
						</div> */}
							{/* </div>
						<div className='report-panel-group'>
							<div className='report-panel-item-header'>
								Shortest Song Played:{' '}
							</div>
							<div className='report-panel-item-detail'>
								{reportData?.shortest_track_name}{' '}
								<span className='report-panel-item-detail-caption'>
									({reportData?.shortest_track_length})
								</span>
							</div> */}
							{/* <div>
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
						</div> */}
						</div>
					</div>
				</div>
				{/* REPORT PANEL RIGHT */}
				<div className='report-panel-right'>
					<div className='report-panel-group'>
						{reportData?.doubles_played.length === 0 ? (
							<>
								<div className='report-panel-item-header'>
									There were no doubles detected during this set.
								</div>
							</>
						) : (
							<>
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
							</>
						)}
					</div>
					<div className='report-panel-group'>
						{reportData?.np_songs_queried.length === 0 ? (
							<>
								<div className='report-panel-item-header'>
									The <span className='foo'>!np</span> command was not used
									during this stream.
								</div>
							</>
						) : (
							<>
								<div className='report-panel-item-header'>
									Songs queried:{' '}
									<span className='doubles-length'>
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
							</>
						)}
					</div>
					<div className='report-panel-group'>
						{reportData?.dyp_search_terms.length === 0 ? (
							<>
								<div className='report-panel-item-header'>
									The <span className='foo'>!dyp</span> command was not used
									during this stream.
								</div>
							</>
						) : (
							<>
								<div className='report-panel-item-header'>
									Terms searched:{' '}
									<span className='doubles-length'>
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
							</>
						)}
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
