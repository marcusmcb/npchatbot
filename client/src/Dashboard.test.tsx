import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'
import { UserProvider } from './context/UserProvider'
import fetchPlaylistSummaries from './utils/fetchPlaylistSummaries'

jest.mock('./hooks/useWebSocket')
jest.mock('./components/ReportViewer', () => () => null)
jest.mock('./utils/fetchPlaylistSummaries', () => jest.fn())

const userData = {
	_id: 'dashboard-test',
	twitchChannelName: 'test_channel',
	twitchChatbotName: 'test_bot',
	seratoDisplayName: 'Test DJ',
	obsWebsocketAddress: 'localhost:4455',
	obsWebsocketPassword: 'test-password',
	isTwitchAuthorized: true,
	isSpotifyAuthorized: true,
	discord: {},
	isAutoIDEnabled: true,
	isAutoIDDelayEnabled: true,
	autoIDDelaySeconds: 3,
	obsClearDisplayTime: 5,
	intervalMessageDuration: 15,
}

const callbacks = new Map<string, (response: unknown) => void>()
const ipcRenderer = {
	send: jest.fn(),
	invoke: jest.fn(),
	on: jest.fn(),
	once: jest.fn(),
	removeAllListeners: jest.fn(),
}

beforeEach(() => {
	jest.useFakeTimers()
	jest.clearAllMocks()
	callbacks.clear()
	jest.mocked(fetchPlaylistSummaries).mockResolvedValue([
		{ _id: 'report-test', dj_name: 'Test DJ', playlist_date: '2026-10-01' },
	])
	ipcRenderer.invoke.mockImplementation(async (channel: string) =>
		channel === 'get-user-data' ? { data: userData } : { success: true }
	)
	ipcRenderer.on.mockImplementation((channel: string, callback: (response: unknown) => void) => callbacks.set(channel, callback))
	ipcRenderer.once.mockImplementation((channel: string, callback: (response: unknown) => void) => callbacks.set(channel, callback))
	window.electron = { ipcRenderer }
	jest.spyOn(console, 'log').mockImplementation(() => {})
	jest.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
	jest.clearAllTimers()
	jest.useRealTimers()
	jest.restoreAllMocks()
})

const renderDashboard = async () => {
	render(<UserProvider><App /></UserProvider>)
	await waitFor(() => expect(screen.getByLabelText('Twitch© Channel Name:')).toHaveValue('test_channel'))
}

test('groups every control under the SVG sections and shows the welcome message', async () => {
	await renderDashboard()
	const credentials = screen.getByRole('region', { name: 'Credentials' })
	expect(within(credentials).getAllByRole('textbox')).toHaveLength(3)
	expect(within(credentials).queryByLabelText('OBS Websocket Address:')).not.toBeInTheDocument()
	expect(within(screen.getByRole('region', { name: 'OBS' })).getByLabelText('OBS Websocket Address:')).toHaveValue('localhost:4455')

	const preferences = screen.getByRole('region', { name: 'Chatbot Preferences' })
	expect(within(preferences).getAllByRole('checkbox')).toHaveLength(4)
	expect(within(preferences).queryByLabelText('Auto ID Delay')).not.toBeInTheDocument()
	const session = screen.getByRole('region', { name: 'Session' })
	expect(within(session).getAllByRole('checkbox')).toHaveLength(3)
	expect(within(session).getByLabelText('Duration (in minutes):')).toHaveValue('15')
	expect(within(session).getByLabelText('Duration (in seconds):')).toHaveValue(3)
	expect(within(screen.getByRole('region', { name: 'Messages' })).getByText('Welcome to npChatbot!')).toBeVisible()

	expect(within(screen.getByRole('region', { name: 'Chatbot Controls' })).getAllByRole('button')).toHaveLength(2)
	expect(within(screen.getByRole('region', { name: 'Playlist Analytics' })).getByRole('button', { name: 'Search Your Play Histories' })).toBeInTheDocument()
})

test('linked accounts reauthorize and analytics keeps its existing browser action', async () => {
	await renderDashboard()
	for (const service of ['Twitch', 'Spotify', 'Discord']) {
		fireEvent.click(screen.getByRole('button', { name: `Authorize ${service}: Linked` }))
		expect(ipcRenderer.send).toHaveBeenCalledWith(`open-${service.toLowerCase()}-auth-url`)
	}
	fireEvent.click(await screen.findByRole('button', { name: 'Search Your Play Histories' }))
	await waitFor(() => expect(ipcRenderer.invoke).toHaveBeenCalledWith(
		'open-playlist-summaries-in-browser',
		expect.objectContaining({ twitchChannelName: 'test_channel', isDiscordAuthorized: true })
	))
})

test('OBS masking keeps real editable values and Update submits all panels together', async () => {
	await renderDashboard()
	const password = screen.getByLabelText('OBS Websocket Password:')
	expect(password).toHaveAttribute('type', 'password')
	fireEvent.click(screen.getByLabelText('Hide Sensitive Fields'))
	expect(password).toHaveAttribute('type', 'text')
	fireEvent.change(password, { target: { value: 'changed-password' } })
	fireEvent.change(screen.getByLabelText('Twitch© Channel Name:'), { target: { value: 'changed_channel' } })
	fireEvent.click(screen.getByLabelText('Enable Interval Messages'))
	fireEvent.change(screen.getByLabelText('Duration (in minutes):'), { target: { value: '20' } })
	fireEvent.change(screen.getByLabelText('Duration (in seconds):'), { target: { value: '7' } })
	fireEvent.click(screen.getByRole('button', { name: 'Update' }))
	expect(ipcRenderer.send).toHaveBeenCalledWith('submit-user-data', expect.objectContaining({
		twitchChannelName: 'changed_channel',
		obsWebsocketPassword: 'changed-password',
		isIntervalEnabled: true,
		intervalMessageDuration: '20',
		autoIDDelaySeconds: 7,
	}))
})

test('Connect changes to Disconnect and connected settings remain locked', async () => {
	await renderDashboard()
	fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
	act(() => callbacks.get('start-bot-response')?.({ success: true, message: 'Connected' }))
	expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument()
	expect(screen.getByLabelText('Twitch© Channel Name:')).toBeDisabled()
	expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
	expect(screen.getByRole('button', { name: 'Authorize Twitch: Linked' })).toBeDisabled()
	expect(screen.getByLabelText('Auto ID Delay')).toBeDisabled()
	fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
	expect(ipcRenderer.send).toHaveBeenCalledWith('stop-bot-script', { seratoDisplayName: 'Test DJ' })
	await act(async () => {
		callbacks.get('stop-bot-response')?.({ success: true })
	})
	await waitFor(() => expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled())
})

test('contextual help replaces the welcome text without hiding the Messages heading', async () => {
	await renderDashboard()
	fireEvent.click(within(screen.getByRole('region', { name: 'Chatbot Preferences' })).getAllByText('?')[0])
	expect(screen.getByRole('heading', { name: 'Messages' })).toBeVisible()
	expect(screen.queryByText('Welcome to npChatbot!')).not.toBeInTheDocument()
	expect(document.querySelector('.info-tooltip')).not.toBeEmptyDOMElement()
})
