const {
	OBS_AUTH_ERROR,
	OBS_AUTH_FAILURE,
	OBS_TIMEOUT_ERROR,
	OBS_SOCKET_ERROR,
	OBS_DEFAULT_ERROR,
} = require('../../bot-assets/constants/constants')

const errorHandler = (error) => {
	let errorResponse
	const errorMessage = error.toString()
	console.error('Failed to connect to OBS: ', errorMessage)
	switch (true) {
		case errorMessage.includes('authentication is required'):
			errorResponse = OBS_AUTH_ERROR
      break
		case errorMessage.includes('Authentication failed'):
			errorResponse = OBS_AUTH_FAILURE
      break
		case errorMessage.includes('connect ETIMEDOUT'):
			errorResponse = OBS_TIMEOUT_ERROR
      break
		case errorMessage.includes('connect ECONNREFUSED'):
			errorResponse = OBS_SOCKET_ERROR
      break
		default:
			errorResponse = OBS_DEFAULT_ERROR
      break
	}
  return errorResponse
}

module.exports = errorHandler
