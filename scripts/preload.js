const { contextBridge, ipcRenderer, shell } = require('electron')
console.log('[preload] script executed')

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		send: (channel, data) => ipcRenderer.send(channel, data),
		invoke: (channel, data) => ipcRenderer.invoke(channel, data),
		on: (channel, func) => {
			const subscription = (_, ...args) => func(...args)
			ipcRenderer.on(channel, subscription)
			return () => ipcRenderer.removeListener(channel, subscription)
		},
		once: (channel, func) => {
			ipcRenderer.once(channel, (_, ...args) => func(...args))
		},
		removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),		
	},	
  // optional utility: forward logs to main
  logToMain: (message) => ipcRenderer.send('renderer-log', message),
})
