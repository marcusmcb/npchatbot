import { useEffect } from 'react'
import { ReportData } from '../types'
import fetchPlaylistSummaries from '../utils/fetchPlaylistSummaries'

const useGetPlaylistData = (
	currentReportIndex: number,
	setPlaylistSummaries: React.Dispatch<React.SetStateAction<any[]>>,
	setCurrentReportIndex: React.Dispatch<React.SetStateAction<number>>,
	setReportData: React.Dispatch<React.SetStateAction<any>>,
	setIsReportReady: React.Dispatch<React.SetStateAction<boolean>>
) => {
	useEffect(() => {
		const fetchPlaylistData = async () => {
			try {
				const playlistSummary = await fetchPlaylistSummaries()
				console.log('Fetched playlist summary:', playlistSummary.length)
				if (playlistSummary && playlistSummary.length !== 0) {
					setPlaylistSummaries(playlistSummary as ReportData[])
					if (currentReportIndex !== 0) {
						setCurrentReportIndex(currentReportIndex)
					} else {
						setCurrentReportIndex(0)
					}
					setReportData(playlistSummary[0] as ReportData)
					setIsReportReady(true)
				} else {
					setPlaylistSummaries([])
					setCurrentReportIndex(0)
					setReportData(null)
					setIsReportReady(false)
				}
			} catch (error) {
				setPlaylistSummaries([])
				setCurrentReportIndex(0)
				setReportData(null)
				setIsReportReady(false)
			}
		}
		fetchPlaylistData()
	}, [])
}

export default useGetPlaylistData
