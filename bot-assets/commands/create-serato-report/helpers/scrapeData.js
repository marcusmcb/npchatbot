const axios = require("axios");
const cheerio = require("cheerio");

const scrapeData = async (url) => {
  let results,
    timestamps,
    starttime,
    playlistdate,
    playlisttitle,
    playlistartist;
  try {
    await axios
      .get(url)
      .then(({ data }) => {
        const $ = cheerio.load(data);
        results = $("div.playlist-trackname");
        timestamps = $("div.playlist-tracktime");
        starttime = $("div.playlist-timestamp").last().text().trim();
        playlistdate = $("span.playlist-start-time").first().text().trim();
        playlisttitle = $("div.playlist-heading h1").text().trim();
        playlistartist = $("span.playlist-dj-subtitle").text().trim();
      })
      .catch((error) => {
        console.log("Error scraping data from Serato Live URL: ", error);
        return error;
      });
  } catch (error) {
    console.log(error);
    return error;
  }  
  playlistartist = playlistartist.split(" ")[3];  
  return [
    results,
    timestamps,
    starttime,
    playlistdate,
    playlisttitle,
    playlistartist,
  ];
};

module.exports = scrapeData;
