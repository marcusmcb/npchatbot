// add logic to scrape data from "live" playlist page with backup logic to
// scrape the data from the first playlist in the user's Serato playlists page
// if the live playlist session has ended

// add method to clear users.db file if user opts to fully
// remove the app from their Twitch configuration

// add logic to handle the case where a user opts to
// fully close the running npChatbot app while it's
// still connected to Twitch

const handleStopBotScript = async (event, arg, tmiInstance) => {
	if (tmiInstance) {
		await tmiInstance.disconnect().then((data) => {
			console.log('TWITCH CHAT HAS BEEN DISCONNECTED')
			console.log('- - - - - - - - - - - - - - - - - -')
		})

		// add logic to save playlist stats and search/query data
		// to NEDB instance when bot script is disconnected from Twitch

		event.reply('stopBotResponse', {
			success: true,
			message: 'ipcMain: bot client successfully disconnected',
			// data: finalReportData,
		})
	} else {
		event.reply('stopBotResponse', {
			success: false,
			error: 'ipcMain: no bot client running to disconnect',
		})
	}
}

module.exports = {
	handleStopBotScript,
}
