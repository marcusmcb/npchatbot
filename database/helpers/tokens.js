const keytar = require('keytar')

const SERVICE_PREFIX = 'npchatbot'

function serviceNameFor(provider) {
  return `${SERVICE_PREFIX}-${provider}`
}

async function storeToken(provider, account = 'default', tokenData) {
  if (!provider) throw new Error('provider required')
  const service = serviceNameFor(provider)
  const value = JSON.stringify(tokenData)
  return keytar.setPassword(service, account, value)
}

async function getToken(provider, account = 'default') {
  if (!provider) throw new Error('provider required')
  const service = serviceNameFor(provider)
  const value = await keytar.getPassword(service, account)
  return value ? JSON.parse(value) : null
}

async function deleteToken(provider, account = 'default') {
  if (!provider) throw new Error('provider required')
  const service = serviceNameFor(provider)
  return keytar.deletePassword(service, account)
}

module.exports = { storeToken, getToken, deleteToken }
