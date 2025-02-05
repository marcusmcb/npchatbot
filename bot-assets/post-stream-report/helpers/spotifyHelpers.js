const getCurrentDate = () => {
	const date = new Date()
	const options = { weekday: 'long', month: 'long', day: 'numeric' }

	// format the date using Intl.DateTimeFormat
	let formattedDate = new Intl.DateTimeFormat('en-US', options).format(date)

	// add the appropriate suffix to the day (e.g., "st", "nd", "rd", "th")
	const day = date.getDate()
	const suffix =
		day % 10 === 1 && day !== 11
			? 'st'
			: day % 10 === 2 && day !== 12
			? 'nd'
			: day % 10 === 3 && day !== 13
			? 'rd'
			: 'th'

	// replace the numeric day in the formatted string with the day + suffix
	formattedDate = formattedDate.replace(/\d+/, `${day}${suffix}`)
	return formattedDate
}

const cleanSongTitle = (title) => {
	return title
		.replace(/\s*[\(\[].*?[\)\]]/g, '')
		.replace(/[&.,-]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
}

const generateRandomState = (length = 16) =>{
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let state = '';
	for (let i = 0; i < length; i++) {
			state += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return state;
}

module.exports = { getCurrentDate, cleanSongTitle, generateRandomState } 