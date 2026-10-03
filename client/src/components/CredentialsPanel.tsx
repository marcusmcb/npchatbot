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
			type={hideSensitiveFields ? 'password' : 'text'}
			id={fieldConfig.id}
			name={fieldConfig.name}
			value={value}
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
	} = useUserContext()

	const isObs = props.section === 'obs'
	const visibleFields = fieldsConfig.filter((field) =>
		isObs
			? field.name === 'obsWebsocketAddress' || field.name === 'obsWebsocketPassword'
			: field.name !== 'obsWebsocketAddress' && field.name !== 'obsWebsocketPassword'
	)

	return (
		<section
			className='app-container-column creds-panel'
			aria-labelledby={`${props.section}-heading`}
		>
			<h2 className='app-form-title' id={`${props.section}-heading`}>
				{isObs ? 'OBS' : 'Credentials'}
			</h2>
			<div className='app-form'>
				{visibleFields.map((field) => (
					<InputField
						key={field.id}
						fieldConfig={field}
						value={formData[field.name]}
						handleInputChange={(event) => setFormData({ [field.name]: event.target.value })}
						showTooltip={props.showTooltip}
						setShowTooltip={props.setShowTooltip}
						hideSensitiveFields={isObs && hideSensitiveFields}
						isObsResponseEnabled={isObsResponseEnabled}
						isBotConnected={props.isBotConnected}
					/>
				))}

				{isObs && (
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
				)}
			</div>
		</section>
	)
}

export default CredentialsPanel
