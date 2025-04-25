/* 

Move message values from error response handlers (Spotify, Serato, Twitch, etc)
throughout the back end into this main constants file for centralization.

*/


const NO_LIVE_DATA_MESSAGE = 'No live playlist data for this stream at the moment.'

const ERROR_MESSAGE = "That doesn't appear to be working right now."

const OBS_AUTH_ERROR = 'Authentication is required to connect to OBS. Please check that your websocket password is correct.'

const OBS_AUTH_FAILURE = 'Authentication failed. Please check that your password is correct.'

const OBS_TIMEOUT_ERROR = 'OBS connection timed out. Check your OBS websocket address or disable OBS responses.'

const OBS_SOCKET_ERROR = 'OBS connection refused. Verify that OBS is running & that your websocket address is correct.'

const OBS_NOT_FOUND_ERROR = 'npChatbot could not connect to OBS. Make sure OBS is running with the correct address and port.'

const OBS_DEFAULT_ERROR = 'Unable to connect to OBS'

const INVALID_TWITCH_URL = "The Twitch profile name given is invalid"

const INVALID_TWITCH_CHATBOT_URL = "The Twitch chatbot profile name given is invalid"

const INVALID_SERATO_DISPLAY_NAME = "The Serato profile name given is invalid"

const INVALID_REFRESH_TOKEN = 'npChatbot was unable to connect to Twitch. Please click the Twitch icon on the left to reauthorize npChatbot.'

const INVALID_SPOTIFY_REFRESH_TOKEN = 'npChatbot was unable to create or update your Spotify playlist. Please click the Spotify icon on the left to reauthorize npChatbot or disable the Spotify feature and click Update to continue.' 

module.exports = {
  NO_LIVE_DATA_MESSAGE,
  ERROR_MESSAGE,
  OBS_AUTH_ERROR,
  OBS_AUTH_FAILURE,
  OBS_TIMEOUT_ERROR,
  OBS_SOCKET_ERROR,
  OBS_DEFAULT_ERROR,
  OBS_NOT_FOUND_ERROR,
  INVALID_REFRESH_TOKEN,
  INVALID_TWITCH_CHATBOT_URL,
  INVALID_TWITCH_URL,
  INVALID_SERATO_DISPLAY_NAME,
  INVALID_SPOTIFY_REFRESH_TOKEN,
}

