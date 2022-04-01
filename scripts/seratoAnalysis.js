const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment')
const dotenv = require('dotenv')

dotenv.config({ path: `../.env` })

// url for testing
const url = `https://serato.com/playlists/${process.env.SERATO_DISPLAY_NAME}/3-17-2022_1`

const createSeratoReport = async () => {
  try {
    await axios
      .get(url)
      .then(({ data }) => {
        const $ = cheerio.load(data)
        const results = $('div.playlist-trackname')
        const timestamps = $('div.playlist-tracktime')

        let tracksPlayed = []
        let trackTimestamps = []
        
        // loop through tracks played and clean data from scrape
        for (let i = 0; i < results.length; i++) {
          let trackId = results[i].children[0].data.trim()
          tracksPlayed.push(trackId)
        }
        // loop through track timestamps and clean data from scrape
        for (let j = 0; j < results.length; j++) {
          let timestamp = timestamps[j].children[0].data.trim()
          timestamp = new Date("01/01/2020 " + timestamp )
          trackTimestamps.push(timestamp)
        }

        console.log(trackTimestamps)

        // combine cleaned data into array of objects
        let trackLog = tracksPlayed.map((result, index) => {          
          return { trackId: result, timestamp: trackTimestamps[index]}
        })
        console.log("* * * * * * * * * * * * * * * * *")        
        console.log(trackLog)
        console.log("* * * * * * * * * * * * * * * * *") 
        
        // let x = trackLog[2].timestamp
        // console.log(x.getTime())
        // let y = trackLog[3].timestamp
        // console.log(y.getTime())
        
        let timeDiffs = []

        for (let k = 0; k < trackTimestamps.length; k++) {
          let x = trackTimestamps[k + 1] - trackTimestamps[k]
          timeDiffs.push(x)
        }  
        console.log(timeDiffs)
        const avg = arr => arr.reduce((a,b) => a + b, 0) / arr.length      
        console.log(avg(timeDiffs))

      })      
      .catch((error) => {        
        // if (error.response.status === 404) {
        //   process.stderr.write('Your Serato URL is incorrect.')          
        // }
        console.log(error)
      })
  } catch (err) {
    console.log(err)
  }
}

createSeratoReport()
// call func to send email report w/stats & data

// FUTURE DEV NOTES
//
// Rewrite this whole script as a standalone webpage
// All the user has to do is copy/paste the link to
// their Serato playlist page and hit analayze
//
// User option to download summary
// User option to aggregate summary (requires data storage $$)