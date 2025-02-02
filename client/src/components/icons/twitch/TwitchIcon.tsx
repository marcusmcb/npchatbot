import React from 'react'

interface TwitchIconProps {
	size?: number
	color?: string
}

const TwitchIcon: React.FC<TwitchIconProps> = ({
	size = 48,
	color = 'currentColor',
}) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		viewBox='0 0 24 24'
		width={size}
		height={size}
		fill='none'
		stroke={color}
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'
		className='twitch-icon'
	>
		<path
			d='M3 2v16h5v4l4-4h4l5-5V2H3z'
			stroke={color}
			strokeWidth='2'
			fill='none'
		/>
		<path d='M14 6v5' stroke={color} strokeWidth='2' />
		<path d='M9 6v5' stroke={color} strokeWidth='2' />
	</svg>
)

export default TwitchIcon
