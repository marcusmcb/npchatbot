### Serato "now playing" Chat Command for Twitch

The index.js file in this repo runs as a message listener for your Twitch channel (via tmi.js) and will display your currently playing track in Serato as a response to the !np command in the chat by scraping the most recent entry on your Serato profile's live playlist page.

<hr>

#### Chat Commands:

* !test (to test communication with Twitch via tmi.js)
* !np (scrapes the Serato live playlist data & returns it as a response)

<hr>

#### What You'll Need:

Node <a href='https://nodejs.org/en/'>14.x</a> installed.

<hr>

#### Twitch OAuth token & connecting to the tmi.js client

To connect the tmi.js client to your Twitch channel, you'll need to generate an <a href="https://twitchapps.com/tmi/">OAuth Token</a>.  

Copy and paste this value into a <a href='https://www.npmjs.com/package/dotenv'>.env file</a> in this repo's root directory.  We'll use this to secure our environment variables for both our Twitch account and our Serato profile display name as follows:

TWITCH_OAUTH_TOKEN='your_oauth_token_value'

TWITCH_BOT_USERNAME='the_name_of_the_bot_account'

TWITCH_CHANNEL_NAME='your_main_channel's_name'

SERATO_DISPLAY_NAME="your_serato_profile_display_name"
<hr>

#### Node Dependencies:

* axios
* cheerio
* dotenv
* tmi.js
* nodemon (optional)

<hr>

#### In use:

After cloning the repo and adding the necessary .env to secure your credentials, run "npm install" to add the necessary dependencies, and then "nodemon index.js" to start the script.

To ensure the script is working, start a Serato live playlist stream by following the directions <a href="https://support.serato.com/hc/en-us/articles/228019568-Live-Playlists">here</a>.  

After starting the playlist stream, your Serato profile will pop up in a new browser window.  Click the "start live playlist" button by scrolling down a bit.  Once done, click the "edit details" button to the right and make sure the playlist is set to "public" (Serato sets this to "private" by default).  Save the changes and begin playing tracks in your Serato DJ software.  You should begin to see the tracks played in the Serato live playlist window in your browser; at this point, the !np command should behave as expected when used in your Twitch channel's chat.

<hr>

#### Questions:

Feel free to message me with any questions regrading the script, configs/setup, or feature requests to expand the concept here.

<hr>

#### The idea here...

To create a Node script that scrapes that most recently played track from your Serato live playlist page and return the text value as a Twitch chat command response.  As a DJ who live-streams this is probably the most common question I see asked in the chats of such channels.  

Marcus McBride, 2022.