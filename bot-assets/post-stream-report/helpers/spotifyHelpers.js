const cleanSongTitle = (title) => {
	return title
		.replace(/\s*[\(\[].*?[\)\]]/g, '')
		.replace(/[&.,-]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
}

const generateRandomState = (length = 16) => {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let state = ''
	for (let i = 0; i < length; i++) {
		state += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return state
}

module.exports = { cleanSongTitle, generateRandomState }
