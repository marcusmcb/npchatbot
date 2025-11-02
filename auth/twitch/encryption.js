const keytar = require('keytar')
const crypto = require('crypto')

// New stable service name; keep lowercase and constant across environments
const NEW_SERVICE = 'npchatbot-secrets'
// Legacy service name kept for migration
const LEGACY_SERVICE = 'npChatbot'
const KEY_ACCOUNT = 'encryptionKey'
const IV_ACCOUNT = 'encryptionIV'

async function setWithRetry(service, account, value) {
	try {
		await keytar.setPassword(service, account, value)
		return true
	} catch (_) {
		try { await keytar.deletePassword(service, account) } catch (_) {}
		await keytar.setPassword(service, account, value)
		return true
	}
}

const getKeyAndIV = async () => {
	// Try new service first
	let key = await keytar.getPassword(NEW_SERVICE, KEY_ACCOUNT)
	let iv = await keytar.getPassword(NEW_SERVICE, IV_ACCOUNT)

	// If missing, attempt to migrate from legacy entries
	if (!key || !iv) {
		const legacyKey = await keytar.getPassword(LEGACY_SERVICE, KEY_ACCOUNT)
		const legacyIv = await keytar.getPassword(LEGACY_SERVICE, IV_ACCOUNT)
		if (legacyKey && legacyIv) {
			await setWithRetry(NEW_SERVICE, KEY_ACCOUNT, legacyKey)
			await setWithRetry(NEW_SERVICE, IV_ACCOUNT, legacyIv)
			// Best-effort cleanup of legacy entries
			try { await keytar.deletePassword(LEGACY_SERVICE, KEY_ACCOUNT) } catch (_) {}
			try { await keytar.deletePassword(LEGACY_SERVICE, IV_ACCOUNT) } catch (_) {}
			key = legacyKey
			iv = legacyIv
		}
	}

	// If still missing, generate fresh and store under new service
	if (!key || !iv) {
		key = crypto.randomBytes(32).toString('hex')
		iv = crypto.randomBytes(16).toString('hex')
		await setWithRetry(NEW_SERVICE, KEY_ACCOUNT, key)
		await setWithRetry(NEW_SERVICE, IV_ACCOUNT, iv)
	}

	return {
		key: Buffer.from(key, 'hex'),
		iv: Buffer.from(iv, 'hex'),
	}
}

const encryptCredential = async (text) => {
	const { key, iv } = await getKeyAndIV()
	let cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
	let encrypted = cipher.update(text)
	encrypted = Buffer.concat([encrypted, cipher.final()])
	return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

const decryptCredential = async (text) => {
	const { key, iv } = await getKeyAndIV()
	let ivBuffer = Buffer.from(text.iv, 'hex')
	let encryptedText = Buffer.from(text.encryptedData, 'hex')
	let decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer)
	let decrypted = decipher.update(encryptedText)
	decrypted = Buffer.concat([decrypted, decipher.final()])
	return decrypted.toString()
}

// test method
const testEncryptionKeys = async (twitchOAuthKey) => {
	console.log('-------------')
	console.log(twitchOAuthKey)
	let encrypted = await encryptCredential(twitchOAuthKey)
	console.log(encrypted)
	let decrypted = await decryptCredential(encrypted)
	console.log(decrypted)
}

module.exports = {
	testEncryptionKeys: testEncryptionKeys,
	encryptCredential: encryptCredential,
	decryptCredential: decryptCredential,
}
