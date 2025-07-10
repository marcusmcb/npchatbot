import React, { useState, Fragment } from 'react'
import { MdArrowBack, MdArrowForward, MdClose } from 'react-icons/md'
import { ReportData, ReportDataProps } from '../types'
import './styles/reportviewer.css'

// add logic in the return to account for the first use case where
// the user has the application installed but has yet to generate
// any play histories

// update the report viewer arrow elements to be in a fixed
// position with the report date placed/centered in between

const ipcRenderer = window.electron.ipcRenderer

interface ReportViewerProps extends ReportDataProps {
	playlistSummaries: ReportData[]
	currentReportIndex: number
	setCurrentReportIndex: (idx: number) => void
	reloadPlaylistSummaries: (deletedIndex: number) => void
}

// helper method to format the set length string
// const formatSetLength = (hours: number, minutes: number): string => {
// 	const parts: string[] = []
// 	if (hours > 0) {
// 		parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
// 	}
// 	if (minutes > 0) {
// 		parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
// 	}

// 	return parts.length > 0 ? parts.join(', ') : '0 seconds'
// }

const ReportViewer: React.FC<ReportViewerProps> = ({
	reportData,
	setReportView,
	playlistSummaries,
	currentReportIndex,
	setCurrentReportIndex,
	reloadPlaylistSummaries,
}): JSX.Element => {
	const [showDeleteModal, setShowDeleteModal] = useState(false)

	// Helper to render set length with colored numbers
	const renderSetLength = () => {
		if (!reportData) return null
		const hours = reportData.set_length_hours
		const minutes = reportData.set_length_minutes
		const parts = []
		if (hours > 0) {
			parts.push(
				<>
					<span className="highlight-color">{hours}</span>
					<span className="main-text-color"> hour{hours > 1 ? 's' : ''}</span>
				</>
			)
		}
		if (minutes > 0) {
			if (parts.length > 0) parts.push(<span className="main-text-color">, </span>)
			parts.push(
				<>
					<span className="highlight-color">{minutes}</span>
					<span className="main-text-color"> minute{minutes > 1 ? 's' : ''}</span>
				</>
			)
		}
		if (parts.length === 0) {
			return <span className="main-text-color">0 seconds</span>
		}
		return parts
	}

	const handleLeftArrowClick = () => {
		if (currentReportIndex < playlistSummaries.length - 1) {
			setCurrentReportIndex(currentReportIndex + 1)
		}
	}

	const handleRightArrowClick = () => {
		if (currentReportIndex > 0) {
			setCurrentReportIndex(currentReportIndex - 1)
		}
	}

	const handleDeletePlaylist = () => {
		setShowDeleteModal(true)
	}

	const handleConfirmDelete = () => {
		setShowDeleteModal(false)
		ipcRenderer.send('delete-selected-playlist', reportData?._id)
		ipcRenderer.once('deletePlaylistResponse', (response: any) => {
			if (response && response.success) {
				reloadPlaylistSummaries(currentReportIndex)
			} else if (response && response.error) {
				console.error('Error deleting playlist:', response.error)
			} else {
				console.error('Unexpected response format from deletePlaylistResponse')
			}
		})
	}

	const handleCancelDelete = () => {
		setShowDeleteModal(false)
	}

	// Helper to deduplicate, count, and sort by count descending
	const getUniqueCounts = (arr: { name: string }[]) => {
		const counts: { [key: string]: number } = {}
		arr.forEach((item) => {
			if (item.name in counts) {
				counts[item.name] += 1
			} else {
				counts[item.name] = 1
			}
		})
		return Object.entries(counts)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
	}

	return (
		<Fragment>
			<div className='report-panel'>
				{/* REPORT PANEL LEFT */}
				<div className='report-panel-left'>
					<div className='report-title'>
						npChatbot Summary for{' '}
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
						<div className='report-subtitle report-date-center'>{reportData?.playlist_date}</div>
						<button
							className='report-date-selector-arrow'
							onClick={handleRightArrowClick}
							aria-label='Next report'
							type='button'
						>
							<MdArrowForward size={16} />
						</button>
						<button
							className='report-date-selector-close'
							onClick={handleDeletePlaylist}
							aria-label='Delete this playlist'
							type='button'
						>
							<MdClose size={16} />
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
							<span className='report-panel-item-value'>{reportData?.set_start_time}</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Set Length:</div>
						<div className='report-panel-item'>
							<span className='report-panel-item-value'>{renderSetLength()}</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Total Tracks Played:</div>
						<div className='report-panel-item'>
							<span className='report-panel-item-value'>{reportData?.total_tracks_played}</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Average Track Length:</div>
						<div className='report-panel-item'>
							<span className='report-panel-item-value'>
								{reportData?.average_track_length_minutes} <span className="report-panel-item-value-span">minutes,</span>{' '}
								{reportData?.average_track_length_seconds} <span className="report-panel-item-value-span">seconds</span>
							</span>
						</div>
					</div>
					<div className='report-panel-item-row'>
						<div className='report-panel-item'>Spotify Link:</div>
						<div className='report-panel-item'>
							<span className='report-panel-item-spotify-link'>
								{reportData?.spotify_link ? (
									<a
										// href='#'
										onClick={(e) => {
											e.preventDefault()
											console.log(
												'Opening Spotify link:', reportData.spotify_link)
											ipcRenderer.send('open-spotify-url', reportData.spotify_link)
										}}
										rel='noopener noreferrer'
										className='spotify-link'
									>
										View Playlist
									</a>
								) : (
									'No playlist created for this stream.'
								)}
							</span>
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
											* {double.track_id}
										</div>
									))}
								</div>
							</>
						)}
					</div>
					<div className='report-panel-group'>
						{reportData && reportData.np_songs_queried.length === 0 ? (
							<>
								<div className='report-panel-item-header'>
									The <span className='report-panel-item-value'>!np</span> command was not used
									during this stream.
								</div>
							</>
						) : reportData ? (
							<>
								<div className='report-panel-item-header'>
									Songs queried:{' '}
									<span className='doubles-length'>
										{reportData.np_songs_queried.length}
									</span>
								</div>
								<div className='report-panel-item-detail'>
									{getUniqueCounts(reportData.np_songs_queried).map((song, index) => (
										<div className='doubles-text' key={index}>
											* {song.name}
											{song.count > 1 && (
												<span className='highlight-color'> ({song.count} times)</span>
											)}
										</div>
									))}
								</div>
							</>
						) : null}
					</div>
					<div className='report-panel-group'>
						{reportData && reportData.dyp_search_terms.length === 0 ? (
							<>
								<div className='report-panel-item-header'>
									The <span className='report-panel-item-value'>!dyp</span> command was not used
									during this stream.
								</div>
							</>
						) : reportData ? (
							<>
								<div className='report-panel-item-header'>
									Terms searched:{' '}
									<span className='doubles-length'>
										{reportData.dyp_search_terms.length}
									</span>
								</div>
								<div className='report-panel-item-detail'>
									{getUniqueCounts(reportData.dyp_search_terms).map((term, index) => (
										<div className='doubles-text' key={index}>
											"{term.name}"
											{term.count > 1 && (
												<span className='main-text-color'> ({term.count} times)</span>
											)}
										</div>
									))}
								</div>
							</>
						) : null}
					</div>
				</div>
			</div>
			{showDeleteModal && (
				<div className='modal-overlay'>
					<div className='modal-content'>
						<div className='modal-title'>Delete Playlist?</div>
						<div className='modal-message'>
							Are you sure you want to delete this playlist? This action cannot
							be undone.
						</div>
						<div className='modal-actions'>
							<button className='modal-btn cancel' onClick={handleCancelDelete}>
								Cancel
							</button>
							<button
								className='modal-btn delete'
								onClick={handleConfirmDelete}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</Fragment>
	)
}

export default ReportViewer
