### Serato "now playing" Chat Command for Twitch

The index.js file in this repo runs as a message listener for your Twitch channel (via tmi.js) and will display your currently playing track in Serato as a response to the !np command in the chat by scraping the most recent entry on your Serato profile's live playlist page.

<hr>

#### Chat Commands:

* !test - to test communication with Twitch via tmi.js
* !np - scrapes the most recent entry in a Serato live playlist & returns its text as a response
* !np previous - scrapes the 2nd most recent entry...
* !np start - scrapes the data from the track you began your live playlist with
* !np vibecheck - scrapes a random entry from your live playlist and returns it & how long ago you played it, a way for your listeners to gauge the "vibe" of your set so far
* !dyp (artist name) - queries the page scrape for the artist's name; if valid, the response displays how many times the artist has been played in your stream so far

<hr>

#### Changelog:

* 03/08/2022 - added rate-limiting to prevent the user from spamming the same command consecutively more than twice
* 03/08/2022 - added list of chat commands within the scope of this script to prevent response conflicts from other chatbots also listening to the same Twitch channel
* 03/08/2022 - added "previous" "start" and "vibecheck" as options/args for the !np command
* 03/10/2022 - added timestamp calculation to "vibecheck" option to display how long ago you played the track in your livestream set
* 03/11/2022 - added "dyp" command (did you play) to let viewers query your Serato live playlist through your Twitch channel
* 03/13/2022 - began front-end/desktop app development for script
* 03/21/2022 - front-end/desktop app both tested & working

<hr>

#### What You'll Need:

Node <a href='https://nodejs.org/en/'>14.x</a> installed.

<hr>

#### Twitch OAuth token (connecting via the tmi.js client)

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

After starting the playlist stream, your Serato profile will pop up in a new browser window.  Click the "start live playlist" button by scrolling down a bit.  Once done, click the "edit details" button to the right and make sure the playlist is set to "public" (Serato sets this to "private" by default).  

Save the changes and begin playing tracks in your Serato DJ software.  You should begin to see the tracks played in the Serato live playlist window in your browser; at this point, the !np command should behave as expected when used in your Twitch channel's chat.

#### A note on file tags:

The tidier your audio file tags are, the better.  However that text appears in your Serato is how it'll appear in the chat.  Just a heads up.

<hr>

#### Testing:

Tested and verified working using Serato DJ Pro 2.5.9 both with the script running locally (via RPi) and remotely (via Heroku - the included Procfile is there for easy deployment to the service).

#### Questions:

Feel free to message me with any questions regrading the script, configs/setup, or feature requests to expand the concept here.

<hr>

#### The idea here...

To build out a set of interactive tools for your Twitch viewers to see what music you're currently playing (or have previously played) in your livestream DJ sets using Serato.  This repo began as a simple Node script and is currently in development as an Electron app.

Marcus McBride, 2022.
