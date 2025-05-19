let npSongsQueried = []
let dypSearchTerms = []
let currentPlaylistSummary

const setCurrentPlaylistSummary = (summary) => {
  currentPlaylistSummary = summary
}

const getCurrentPlaylistSummary = () => {
  return currentPlaylistSummary
}

module.exports = {
  npSongsQueried,
  dypSearchTerms,  
  setCurrentPlaylistSummary,
  getCurrentPlaylistSummary,
}