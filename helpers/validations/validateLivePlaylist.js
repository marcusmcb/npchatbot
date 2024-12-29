const axios = require("axios");
const cheerio = require("cheerio");

const validateLivePlaylist = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $("span.playlist-start-time").first().text().trim();
    if (title.includes("Live now!")) {
      console.log("Serato Playlist is live.");
      return true;
    } else {
      console.log("Serato Playlist is NOT live.");
      return false;
    }
  } catch (error) {
    console.error("Error checking live playlist URL: ", error);
    return false;
  }
};

module.exports = { validateLivePlaylist: validateLivePlaylist }