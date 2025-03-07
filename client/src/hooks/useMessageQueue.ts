import { useEffect, useRef } from 'react'

const useMessageQueue = (
	messageQueue: string[],
	setMessageQueue: React.Dispatch<React.SetStateAction<string[]>>,
	currentMessage: string | null,
	setCurrentMessage: React.Dispatch<React.SetStateAction<string | null>>
) => {
	const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		if (messageTimeoutRef.current) {
			clearTimeout(messageTimeoutRef.current)
			messageTimeoutRef.current = null
		}
		if (messageQueue.length > 0 || currentMessage) {
			if (messageQueue.length > 0) {
				const newMessage = messageQueue[0]
				setCurrentMessage(newMessage)
				setMessageQueue((prevQueue) => prevQueue.slice(1))
			}
			messageTimeoutRef.current = setTimeout(() => {
				setCurrentMessage(null)
			}, 5000)
		}
	}, [messageQueue, currentMessage, setMessageQueue, setCurrentMessage])

	return messageTimeoutRef
}

export default useMessageQueue
