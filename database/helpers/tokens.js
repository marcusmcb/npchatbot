const keytar = require('keytar')

// Stable, cross-platform prefix so dev and packaged builds use the same Keychain/Windows Credential items
// NOTE: keep this lowercase and unchanged to avoid creating duplicate entries across versions.
const SERVICE_PREFIX = 'npchatbot'

const serviceNameFor = (provider) => {
	return `${SERVICE_PREFIX}-${provider}`
}

// Best-effort set with ACL-friendly retry: if set fails, delete then set again.
const setWithRetry = async (service, account, value) => {
	try {
		await keytar.setPassword(service, account, value)
		return true
	} catch (e1) {
		try {
			await keytar.deletePassword(service, account)
		} catch (_) {
			// ignore delete failures, we'll still try to set
		}
		try {
			await keytar.setPassword(service, account, value)
			return true
		} catch (e2) {
			const meta = {
				service,
				account,
				platform: process.platform,
				packaged: !!process.resourcesPath,
			}
			const err = new Error(
				`keytar setPassword failed: ${
					e2 && e2.message ? e2.message : String(e2)
				} | meta=${JSON.stringify(meta)}`
			)
			err.cause = e2
			throw err
		}
	}
}

const storeToken = async (provider, account = 'default', tokenData) => {
	if (!provider) throw new Error('provider required')
	const service = serviceNameFor(provider)
	const value = JSON.stringify(tokenData)
	try {
		return await setWithRetry(service, account, value)
	} catch (e) {
		// On mac packaged builds, some environments reject per-user accounts unexpectedly.
		// Fall back to a shared 'default' account so the app remains usable.
		const isDarwin = process.platform === 'darwin'
		const isPackaged = !!process.resourcesPath
		if (isDarwin && isPackaged && account !== 'default') {
			return await setWithRetry(service, 'default', value)
		}
		throw e
	}
}

const getToken = async (provider, account = 'default') => {
	if (!provider) throw new Error('provider required')
	const service = serviceNameFor(provider)
	let value = await keytar.getPassword(service, account)
	if (!value) {
		// Read fallback to 'default' for mac packaged builds to match write fallback
		const isDarwin = process.platform === 'darwin'
		const isPackaged = !!process.resourcesPath
		if (isDarwin && isPackaged && account !== 'default') {
			value = await keytar.getPassword(service, 'default')
		}
	}
	if (!value) return null
	try {
		return JSON.parse(value)
	} catch (_) {
		// If older entries were stored as plain strings, return as-is
		return value
	}
}

const deleteToken = async (provider, account = 'default') => {
	if (!provider) throw new Error('provider required')
	const service = serviceNameFor(provider)
	return keytar.deletePassword(service, account)
}

module.exports = {
	SERVICE_PREFIX,
	serviceNameFor,
	storeToken,
	getToken,
	deleteToken,
}
