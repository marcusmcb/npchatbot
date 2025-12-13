### npChatbot for Serato DJ Pro & Twitch

#### Visit the npChatbot project website <a href="https://www.npchatbot.com">here</a>!

This repo contains the source code the npChatbot desktop software for PC & Mac.

npChatbot is a utility app for DJs who stream live on Twitch using Serato.  

Once downloaded, installed, and authorized with Twitch, npChatbot enables a series of interactive music discovery commands that allow your viewers to search your play history in real-time.  

npChatbot also has the option to authorize the app with your Spotify account, allowing you to create and update playlists of your DJ sets with each song you play, which you can easily share with your streaming community using the included <strong>!np playlist</strong> command.

The app is built and packaged with Electron, utilizing NodeJS, React, custom CSS, and a mix of both JavaScript and TypeScript.

<hr>

### Chat Commands:

You can view the full command list <a href="https://www.npchatbot.com/commands">here</a>.

<hr>

### Authorizing via Twitch:

When starting the app for the first time, in the upper left hand of the client UI, you'll see an option to authorize the app with Twitch. After clicking the link, you'll be prompted to authorize the app and, once completed, you'll be returned to npChatbot with an update to note that the app is now authorized.

<b>NOTE:</b> Most live-streamers on Twitch will typically use a second, dedicated chatbot account for utilities such as npChatbot, but the app can be configured to use your primary Twitch channel to receive npChatbot's responses.

If you're using a dedicated chatbot account for this app, the chatbot account <i>must</i> be set as a moderator for your primary channel in order for it to work.

<hr>

### User Credentials

Once authorized, you can then enter in your user credentials:

- Twitch Channel Name (your primary streaming channel)
- Twitch Chatbot Name (the account you've authorized npChatbot with)
- Serato Display Name (your Serato user profile name)
- OBS Websocket Address & Password (optional - see below)

<hr>

### OBS Websocket & Password (optional)

To display command responses on-screen via OBS during your livestream, you'll need to enable/configure a <a href="https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-using-websockets.466/">web socket</a> connection for OBS.

Once done, you can store the OBS websocket address and password (if secured) values in the npChatbot app's Credentials section which will then enable the "Enable On-Screen OBS Responses" option in the Preferences section.

<hr>

### Enable On-Screen OBS Responses (optional)

This setting determines how long the text response from npChatbot will appear on-screen in OBS before clearing; a value of 5 seconds is set by default if this option is enabled but no value is entered.

The OBS responses are configured within the chatbot script to return its responses to a common Text (GDI+) element named `'npchatbot-response'`. You can easily create this element and set its name and add it to any scene in your OBS collection.

Font size/color, element sizing, and placement are <b>not</b> programmatically set by this script; you'll need to make these determinations for best use within your own Twitch stream.

<hr>

### Authorizing via Spotify (optional):

npChatbot also gives you the option to connect the app to your Spotify account.  Once authorized, enabling the "Create Spotify Playlist" option from the UI will create a new Spotify playlist each time npChatbot is connected to Twitch.

The playlist created will then be updated with the songs you play during your DJ set in real time.  You and your viewers can view the playlist at any time during your stream using the included "!np playlist" command which returns a link to the current stream's playlist to your chat.

<hr>

### Auto ID & Tag Cleanup (optional)

When enabled, npChatbot will automatically send a message to your channel's chat with the artist and title of each new song you play during your stream.  Additionally, npChatbot includes a tag clean-up feature which removes any additional text in parentheses or brackets from the current song playing before sending it to your chat.

### Automated/Interval Messages (optional)

In the Preferences section, when "Enable Interval Message" is enabled, npChatbot will periodically add a message to your chat that prompts your viewers to try out the various npChatbot commands.

The "interval duration" value (given in minutes) determines how often these message will appear if enabled; a value of 15 minutes is set by default if this option is enabled but no value is entered.

<hr>

### Enabling/Starting a Serato Live Playlist

In order for this script to work properly, you'll need to be familiar with how to start a <a href='https://support.serato.com/hc/en-us/articles/228019568-Live-Playlists'>Live Playlist</a> session in Serato DJ Pro, a feature which allows you to transmit your real-time playlist data to the web.

After starting the live playlist, your Serato profile will pop up in a new browser window. Click the "start live playlist" button by scrolling down a bit. Once done, click the "edit details" button to the right and make sure the playlist is set to "public" (Serato sets this to "private" by default).

Save the changes and begin playing tracks in your Serato DJ software. You should begin to see the tracks played in the Serato live playlist window in your browser; at this point, the npChatbot commands should behave as expected when used in your Twitch channel's chat.

NOTE: To ensure the accuracy of the analysis in several commands' responses, the Live Playlist should be started roughly the same time that your live stream does.

### Testing your Serato Live Playlist's status

As mentioned above, your Serato Live Playlist's status will need to be set as "public" in order for npChatbot to work properly.

In the Session Controls section of the UI, you'll see a control marked "Playlist Status".  

You can tap or click this button at any time to test the current status and visibility of your Serato Live Playlist.  If configured properly, you'll see a message in the UI indicating this and, if not, a message will provide guidance on how to properly configure your live playlist.  

<hr>

### Chatbot Controls

Once your user credentials and preferences have been set, click "Connect" to start the npChatbot script. The Session Info panel will update to display the current connection status and uptime.

With a Serato Live Playlist successfully running, you'll now be able to use all of the commands within the npChatbot app in your Twitch chat while live-streaming.

When you've completed your live stream, simply click "Disconnect" to disconnect the npChatbot script.

<hr>

### Development Stack:

- React + TypeScript (client UI)
- Electron (back end logic, data API, and handlers)
- Electron-Forge (desktop build and packaging)
- NodeJS (ES modules for chatbot scripting, web scraping, and playlist analysis)
- Twitch API / TMI.js (app authorization & chat event listeners)
- OBS-Websocket-JS (OBS text integration)
- Spotify API (playlist creation, song-level queries, real-time playlist updates)
- Discord API (channel webhook creation for sharing Spotify playlists)

<hr>

### A note on file tags:

The cleaner your audio file tags are, the better. However the text appears in your Serato is how it'll appear in the chat. Just a heads up.

<hr>

### Testing:

Tested and verified working using Serato DJ Pro (versions 3.0.1 -> 3.2.4) and OBS Studio (versions 29.0.2 -> 31.0.0) (64-bit) on Windows 10/11 and Mac (Sequoia).

<hr>

#### Questions & Bug Reports:

Feel free to message me with any questions regrading the app, configuration/setup, or feature requests to expand the core concept <a href='mailto:npchatbotapp@gmail.com'>here</a>.

Likewise, you can report any bugs or errors to this address as well (I check it regularly!).  Screen-shots help if you happen to have one of the bug/error in question.

<hr>

#### The big idea...

To create and integrate a set of interactive chat tools for your Twitch channel that allow your viewers to directly interact with your Serato play history in real time during your live streams.

Music discovery is a key and often under-rated aspect of Twitch.  npChatbot aims to facilitate this by giving viewers a direct means to interact with a streamer's live play history.  

Doing so allows viewers to directly look up any song currently playing, any song or artist previously played, along with real-time stats that are unique to each DJ and each stream.  

The real time command use by viewers also gives DJs streaming on Twitch some insight as to what artists, songs, or genres of music their live audiences are signalling an interest in.

The added Spotify integration gives streaming DJs an easily shareable playlist with their communities, further fortifying the bond with their respective audiences.

This began as a simple Node script, running on a Raspberry Pi here in my office to give viewers in my own channel an easy way to look up the song "now playing".  It's now a fully-fledged desktop app, ready for you to download and try out for yourself.

Marcus McBride, 2026.
