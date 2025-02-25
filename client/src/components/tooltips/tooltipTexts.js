const tooltipTexts = {
	twitchChannelName: 'Enter your primary Twitch© channel name here.',
	twitchChatbotName:
		"Enter your Twitch© channel's chatbot name here. More details can be found <a href='https://www.npchatbot.com/' rel='noreferrer' target='_blank'>here</a>.",
	obsClearDisplayTime:
		'Enter the duration (in seconds) for the OBS response to remain on screen.   This feature is enabled when you enter your OBS Websocket address.',
	seratoDisplayName:
		'Enter your Serato© profile display name here.  More details on how to find this can found <a href="https://www.npchatbot.com/installation?tab=Credentials" rel="noreferrer" target="_blank">here</a>.',
	intervalMessageDuration:
		"Enter the duration (in minutes) for automatic interval messages to appear.  More details about this feature can be found <a href='https://www.npchatbot.com/installation?tab=Preferences' rel='noreferrer' target='_blank'>here</a>.",
	obsWebsocketAddress:
		'Enter your local OBS web socket address here (optional).',
	obsWebsocketPassword:
		'If your web socket connection is secured within OBS, please enter the password here (optional)',
	userEmailAddress:
		"Enter the email address that you'd like your post-stream report sent to",
	spotifyPlaylistEnabled:
		'With this feature enabled, a Spotify© playlist of your current set will be created each time you connect npChatbot to Twitch.',
	continueLastPlaylist:
		'If you need to disconnect and reconnect npChatbot to Twitch during your stream, enabling this feature will continue adding songs to the last Spotify© playlist created instead of creating a new one.',
	autoIDEnabled:
		'Enable this feature to automatically display the song currently playing in your chat as it changes.',
	autoIDCleanupEnabled:
		'With Auto ID enabled, this feature removes any text within brackets or parentheses from the current song artist & title displayed in your chat.',
}

export default tooltipTexts
