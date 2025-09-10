export {} // this file needs to be a module

declare global {
	interface Window {
		electron: {
			ipcRenderer: {
				send: (channel: string, data?: any) => void
				invoke: (channel: string, data?: any) => Promise<any>
				on: (channel: string, func: (...args: any[]) => void) => void
				once: (channel: string, func: (...args: any[]) => void) => void
				removeAllListeners: (channel: string) => void
			}
			logToMain?: (message: string) => void
		}
	}
}
