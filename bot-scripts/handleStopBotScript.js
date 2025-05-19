// add method to clear users.db file if user opts to fully
// remove the app from their Twitch configuration

const handleStopBotScript = async (event, arg, tmiInstance) => {
	if (tmiInstance) {
		await tmiInstance.disconnect().then((data) => {
			console.log('TWITCH CHAT HAS BEEN DISCONNECTED')
			console.log('- - - - - - - - - - - - - - - - - -')
		})		
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
