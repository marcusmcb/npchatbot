// node dependencies
const axios = require("axios");
const cheerio = require("cheerio");
const tmi = require("tmi.js");
const dotenv = require("dotenv");

// secure twitch oauth token for tmi
dotenv.config();

// create tmi instance
const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL_NAME],
});

client.connect();

// chat command listener
client.on("message", (channel, tags, message, self) => {
  console.log("MESSAGE: ", message);
  if (self || !message.startsWith("!")) {
    return;
  }

  const args = message.slice(1).split(" ");
  const command = args.shift().toLowerCase();

  switch (command) {
    // test command to verify client connection to twitch chat
    case "test":
      client.say(
        channel,
        "Your Twitch chat is properly linked to this script!"
      );
      break;
    // now playing
    case "np":
      // serato live playlist page to scrape
      
      // *** NOTE ***
      
      // SERATO_DISPLAY_NAME is set to the user's Serato profile display name by default
      // when starting a Serato live playlist session the user can update/edit their display name
      // if they do so, this bot will NOT work unless it's also updated in the .env file

      const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/live`;
      const scrapeData = async () => {
        try {
          const { data } = await axios.get(url);
          const $ = cheerio.load(data);          
          const results = $("div.playlist-trackname");
          // return the most recent entry as chat response
          client.say(channel, `Now playing: ${results.last().text()}`);
        } catch (err) {
          console.error(err);
          client.say(channel, "Looks like that isn't working right now.");
        }
      };
      scrapeData();
      break;

    // no response as default for any other command input
    default:
      break;
  }
});