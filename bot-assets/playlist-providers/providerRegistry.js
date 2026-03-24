const spotifyProvider = require('./spotifyProvider')

// Registry kept intentionally simple for now.
// New providers should be added here and implement the same interface.
const providers = [spotifyProvider]

const getPlaylistProviders = () => providers

const getEnabledPlaylistProviders = (config) =>
	providers.filter((provider) => provider.isEnabled(config))

module.exports = {
	getPlaylistProviders,
	getEnabledPlaylistProviders,
}
