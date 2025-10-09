const db = require('../../database/database')
const getUserData = require('./getUserData')
const { getToken } = require('../../helpers/tokens')

// Return a promise resolving to the discord token blob. Prefer keytar, fall back to DB stored fields.
const getDiscordTokens = async () => {
  try {
    const user = await getUserData(db)
    if (!user) return null

    // Try keytar first
    try {
      if (user._id) {
        const tokenBlob = await getToken('discord', user._id)
        if (tokenBlob) return tokenBlob
      }
    } catch (e) {
      // ignore keytar errors and fall back to DB
    }

    // Fallback to legacy DB fields
    return user.discord || null
  } catch (err) {
    throw err
  }
}

module.exports = getDiscordTokens
