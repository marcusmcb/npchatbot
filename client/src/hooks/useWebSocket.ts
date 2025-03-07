import { useEffect, useRef } from 'react'

const useWebSocket = (
	url: string,
	onMessage: (event: MessageEvent) => void,
	onOpen?: () => void,
	onError?: (event: Event) => void
) => {
	const socketRef = useRef<WebSocket | null>(null)

	useEffect(() => {
		const socket = new WebSocket(url)
		socketRef.current = socket

		socket.addEventListener('open', () => {
			console.log(`WebSocket is open now: ${url}`)
			if (onOpen) onOpen()
		})

		socket.addEventListener('message', onMessage)

		socket.addEventListener('error', (event) => {
			console.error(`WebSocket error: ${url}`, event)
			if (onError) onError(event)
		})

		// return () => {
		// 	socket.close()
		// }
	}, [url, onMessage, onOpen, onError])

	return socketRef.current
}

export default useWebSocket
