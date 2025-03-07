import { useEffect } from 'react'

const useTooltipVisibility = (
	showTooltip: string | null,
	setShowTooltip: (value: string | null) => void
) => {
	useEffect(() => {
		const handleOutsideClick = (event: any) => {
			if (
				showTooltip &&
				!event.target.closest('.question-icon') &&
				!event.target.closest('.info-tooltip')
			) {
				setShowTooltip(null)
			}
		}
		window.addEventListener('click', handleOutsideClick)
		return () => {
			window.removeEventListener('click', handleOutsideClick)
		}
	}, [showTooltip, setShowTooltip])
}

export default useTooltipVisibility
