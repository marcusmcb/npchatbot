import React from 'react'
import { CredentialsPanelProps, CredentialsFieldConfig } from '../types'
import { useUserContext } from '../context/UserContext'
import '../App.css'
import './styles/credentialspanel.css'

const fieldsConfig: CredentialsFieldConfig[] = [
	{
		id: 'twitch-channel-name',
		label: 'Twitch© Channel Name:',
		name: 'twitchChannelName',
		placeholder: 'required',
	},
	{
		id: 'twitch-chatbot-name',
		label: 'Twitch© Chatbot Name:',
		name: 'twitchChatbotName',
		placeholder: 'required',
	},
	{
		id: 'serato-display-name',
		label: 'Serato© Display Name:',
		name: 'seratoDisplayName',
		placeholder: 'required',
	},
	{
		id: 'obs-websocket-address',
		label: 'OBS Websocket Address:',
		name: 'obsWebsocketAddress',
		placeholder: '192.0.0.1:4455',
	},
	{
		id: 'obs-websocket-password',
		label: 'OBS Websocket Password:',
		name: 'obsWebsocketPassword',
		placeholder: 'optional',
	},
]

const InputField: React.FC<{
	fieldConfig: CredentialsFieldConfig
	value: string | undefined
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	hideSensitiveFields: boolean
	isObsResponseEnabled: boolean
	isBotConnected: boolean
}> = ({
	fieldConfig,
	value = '',
	handleInputChange,
	showTooltip,
	setShowTooltip,
	hideSensitiveFields,
	isObsResponseEnabled,
	isBotConnected,
}) => (
	<div className='form-field'>
		<label htmlFor={fieldConfig.id}>{fieldConfig.label}</label>
		<input
			type='text'
			id={fieldConfig.id}
			name={fieldConfig.name}
			value={
				hideSensitiveFields &&
				(fieldConfig.name === 'obsWebsocketPassword' ||
					fieldConfig.name === 'obsWebsocketAddress')
					? '*'.repeat((value || '').length)
					: value
			}
			onChange={handleInputChange}
			placeholder={fieldConfig.placeholder}
			className={
				(!isObsResponseEnabled &&
					(fieldConfig.name === 'obsWebsocketAddress' ||
						fieldConfig.name === 'obsWebsocketPassword')) ||
				isBotConnected
					? 'muted-input'
					: ''
			}
			disabled={isBotConnected}
		/>
		<span
			className={`question-icon ${
				showTooltip === fieldConfig.name ? 'active-icon' : ''
			}`}
			onClick={() =>
				setShowTooltip(
					showTooltip === fieldConfig.name ? null : fieldConfig.name
				)
			}
		>
			?
		</span>
	</div>
)

const CredentialsPanel: React.FC<CredentialsPanelProps> = (props) => {
	const [hideSensitiveFields, setHideSensitiveFields] = React.useState(true)
	const {
		formData,
		setFormData,
		isObsResponseEnabled,
		isTwitchAuthorized,
		isFormModified,
	} = useUserContext()

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target
		setFormData({ [name]: value } as any)
	}

	return (
		<div className='app-container-column creds-panel'>
			<div className='app-form-title'>Enter your credentials below:</div>
			<form className='app-form' onSubmit={props.handleSubmit}>
				{fieldsConfig.map((field) => (
					<InputField
						key={field.id}
						fieldConfig={field}
						value={(formData as any)[field.name]}
						handleInputChange={handleInputChange}
						showTooltip={props.showTooltip}
						setShowTooltip={props.setShowTooltip}
						hideSensitiveFields={hideSensitiveFields}
						isObsResponseEnabled={isObsResponseEnabled}
						isBotConnected={props.isBotConnected}
					/>
				))}

				<div className='button-row'>
					<button
						className={`default-button ${
							isFormModified ? 'button-modified' : ''
						}`}
						disabled={props.isBotConnected || !isTwitchAuthorized}
						type='submit'
					>
						Update
					</button>
					<div className='toggle-field hide-sensitive-toggle'>
						<input
							type='checkbox'
							id='hideSensitiveFields'
							checked={hideSensitiveFields}
							onChange={(e) => setHideSensitiveFields(e.target.checked)}
						/>
						<label
							htmlFor='hideSensitiveFields'
							className='toggle-text-label-color sensitive-fields-text'
						>
							Hide Sensitive Fields
						</label>
					</div>
				</div>
			</form>
		</div>
	)
}

export default CredentialsPanel
