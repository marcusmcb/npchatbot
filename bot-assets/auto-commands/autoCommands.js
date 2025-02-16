/*

Rename this directory as "interval-messages" and update the necessary
require statements throughout the project.

*/

const dypInfo = (channel, tags, args, client) => {
	client.say(
		channel,
		"You can search my play history any time using the !dyp command (Did you play...?).  Enter the command followed by the title, artist, or phrase you want to search for and you'll see the results in the chat!"
	)
}

const npInfo = (channel, tags, args, client) => {
	client.say(
		channel,
		'If you want to know what song is currently playing, enter !np in the chat to find out.  If you want to know what song was played before the current one, enter !np previous in the chat to find out.'
	)
}

const statsInfo = (channel, tags, args, client) => {
	client.say(
		channel,
		"You can look up the playlist stats for this stream any time with the !np stats command.  It'll show you how many songs I've played so far along with average song length for this set currently."
	)
}

const doublesInfo = (channel, tags, args, client) => {
	client.say(
		channel,
		"Want to see how many times I've cut it up during this stream?  Use the !np doubles command to find out how many times and which songs I've cut it up with!"
	)
}

const vibecheckInfo = (channel, tags, args, client) => {
	client.say(
		channel,
		"Want to see what the vibe's been like in this stream so far?  Hit the !np vibecheck command to see a random selection from this set to find out!"
	)
}

module.exports = {
	dypInfo: dypInfo,
	npInfo: npInfo,
	statsInfo: statsInfo,
	doublesInfo: doublesInfo,
  vibecheckInfo: vibecheckInfo,
}
