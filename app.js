const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const { spawn } = require('child_process')

const PORT = 5000 || process.env.PORT
const app = express()

// global var to carry pid value
let child

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// api endpoint to save user creds as .env file
app.post('/saveCreds', async (req, res) => {
  console.log('REQ: ', req.body)
  let userValues =
    'TWITCH_OAUTH_TOKEN=' +
    `"${req.body.TWITCH_OAUTH_TOKEN}"` +
    '\n' +
    'TWITCH_CHANNEL_NAME=' +
    `"${req.body.TWITCH_CHANNEL_NAME}"` +
    '\n' +
    'TWITCH_BOT_USERNAME=' +
    `"${req.body.TWITCH_BOT_USERNAME}"` +
    '\n' +
    'SERATO_DISPLAY_NAME=' +
    `"${req.body.SERATO_DISPLAY_NAME}"` +
    '\n'

  await fs.writeFile('.env', userValues, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('File created successfully.')
      console.log(fs.readFileSync('.env', 'utf8'))
    }
  })
  res.send('Credentials saved.')
})

// api endpoint to start serato bot script
app.get('/startBot', (req, res) => {
  let pid = spawn(`node`, [__dirname + '\\index.js'])
  pid.on('error', (err) => {
    console.log(err)
  })
  pid.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })
  res.send({ pid: pid.pid })
})

// api endpoint to kill serato bot script
app.get('/endBot/:pid', (req, res) => {
  let pid = req.params.pid
  console.log('PID: ', pid)  
  let x = spawn('taskkill', ['/PID', pid, '/F'])
  x.on('error', (err) => {
    console.log(err)
  })
  x.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })
  res.send('Done')
})

// main app port listener
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
})
