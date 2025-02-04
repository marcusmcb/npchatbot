const axios = require('axios')
const db = require('../database')
const logToFile = require('../scripts/logger')
const WebSocket = require('ws')

const exchangeCodeForSpotifyToken = async (code) => {

}

const initSpotifyAuthToken = async (code, wss, mainWindow) => {
}

const getSpotifyRefreshToken = async (refreshToken) => {
}

const updateSpotifyUserToken = async (db, event, token) => {

}

module.exports = {
  exchangeCodeForSpotifyToken,
  initSpotifyAuthToken,
  getSpotifyRefreshToken,
  updateSpotifyUserToken,
}