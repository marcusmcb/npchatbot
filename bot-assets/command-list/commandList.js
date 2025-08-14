const { npCommands } = require('../commands/now-playing/npCommands')
const { dypCommand } = require('../commands/did-you-play/didYouPlay')
const { dypInfo, statsInfo, npInfo } = require('../auto-commands/autoCommands')

const commandList = {	
	np: npCommands,
	dyp: dypCommand,
	dypInfo: dypInfo,
	statsInfo: statsInfo,
	npInfo: npInfo,
}

const urlCommandList = {
	np: npCommands,
	dyp: dypCommand,
}

module.exports = {
	commandList: commandList,
	urlCommandList: urlCommandList,
}
