const handleConnect = async (
  event: React.MouseEvent<HTMLButtonElement>,
  formData: any,
  ipcRenderer: any,
  addMessageToQueue: (message: string) => void,
  setIsBotConnected: (connected: boolean) => void,
  setError: (error: string) => void
) => {
  addMessageToQueue('Connecting to Twitch...')
  console.log('*** sending startBotScript ***')
  ipcRenderer.send('startBotScript', {
      twitchChannelName: formData.twitchChannelName,
      obsWebsocketAddress: formData.obsWebsocketAddress
          ? formData.obsWebsocketAddress
          : '',
      obsWebsocketPassword: formData.obsWebsocketPassword
          ? formData.obsWebsocketPassword
          : '',
      isObsResponseEnabled: formData.isObsResponseEnabled,
      twitchRefreshToken: formData.twitchRefreshToken,
      spotifyRefreshToken: formData.spotifyRefreshToken,
      isSpotifyEnabled: formData.isSpotifyEnabled,
      continueLastPlaylist: formData.continueLastPlaylist,
      seratoDisplayName: formData.seratoDisplayName,
  })
  console.log('*** startBotScript sent; awaiting response ***')
  ipcRenderer.on('startBotResponse', (response: any) => {
      if (response && response.success) {
          console.log('--- successfully startBotResponse ---')
          addMessageToQueue(response.message)
          setIsBotConnected(true)
      } else if (response && response.error) {
          console.error(response.error)
          setError(response.error)
          addMessageToQueue(response.error)
      } else {
          console.error('Unexpected response format from startBotResponse')
      }
  })
}

export default handleConnect