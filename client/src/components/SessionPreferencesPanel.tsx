import React from 'react'
import '../App.css'
import './styles/preferencespanel.css'
import { useUserContext } from '../context/UserContext'

type SessionPreferencesPanelProps = {
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	isBotConnected: boolean
}

type SessionSetting = {
	id: string
	label: string
	enabled: boolean
	disabled: boolean
	onToggle: () => void
	fieldId: string
	fieldName?: string
	fieldLabel: string
	value: string | number
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	tooltipKey: string
	type?: 'number'
	min?: number
	max?: number
}

const SessionPreferencesPanel: React.FC<SessionPreferencesPanelProps> = (props) => {
	const {
		formData, setFormData, isTwitchAuthorized,
		isObsResponseEnabled, setIsObsResponseEnabled,
		isIntervalEnabled, setIsIntervalEnabled,
		isAutoIDEnabled, isAutoIDDelayEnabled, setIsAutoIDDelayEnabled,
		autoIDDelaySeconds, setAutoIDDelaySeconds,
	} = useUserContext()

	const settings: SessionSetting[] = [
		{
			id: 'obsResponseToggle',
			label: 'Enable OBS Responses',
			enabled: isObsResponseEnabled,
			disabled: !isTwitchAuthorized || !formData.obsWebsocketAddress || props.isBotConnected,
			onToggle: () => setIsObsResponseEnabled(!isObsResponseEnabled),
			fieldId: 'obs-clear-display-time',
			fieldName: 'obsClearDisplayTime',
			fieldLabel: 'Display time (in seconds):',
			value: formData.obsClearDisplayTime,
			onChange: (event) => setFormData({ obsClearDisplayTime: event.target.value }),
			tooltipKey: 'obsClearDisplayTime',
		},
		{
			id: 'intervalMessageToggle',
			label: 'Enable Interval Messages',
			enabled: isIntervalEnabled,
			disabled: !isTwitchAuthorized || props.isBotConnected,
			onToggle: () => setIsIntervalEnabled(!isIntervalEnabled),
			fieldId: 'obs-interval-duration',
			fieldName: 'intervalMessageDuration',
			fieldLabel: 'Duration (in minutes):',
			value: formData.intervalMessageDuration,
			onChange: (event) => setFormData({ intervalMessageDuration: event.target.value }),
			tooltipKey: 'intervalMessageDuration',
		},
		{
			id: 'autoIDDelayEnabled',
			label: 'Auto ID Delay',
			enabled: isAutoIDDelayEnabled,
			disabled: !isTwitchAuthorized || !isAutoIDEnabled || props.isBotConnected,
			onToggle: () => setIsAutoIDDelayEnabled(!isAutoIDDelayEnabled),
			fieldId: 'autoIDDelaySeconds',
			fieldLabel: 'Duration (in seconds):',
			value: autoIDDelaySeconds,
			onChange: (event) => setAutoIDDelaySeconds(Math.max(0, Math.min(99, Number(event.target.value)))),
			tooltipKey: 'autoIDDelayEnabled',
			type: 'number',
			min: 0,
			max: 99,
		},
	]

	return (
		<section className='app-container-column' aria-labelledby='session-heading'>
			<h2 className='app-form-title' id='session-heading'>Session</h2>
			{settings.map((setting) => (
				<div className='session-setting' key={setting.id}>
					<div className='toggle-field'>
						<input
							type='checkbox'
							id={setting.id}
							checked={setting.enabled}
							disabled={setting.disabled}
							onChange={setting.onToggle}
							className={setting.disabled ? 'disabled-toggle' : ''}
						/>
						<label htmlFor={setting.id} className={!setting.enabled || setting.disabled ? 'disabled-label' : ''}>
							{setting.label}
						</label>
					</div>
					<div className='form-field session-pref-field'>
						<label htmlFor={setting.fieldId} className={!setting.enabled || setting.disabled ? 'disabled-label' : ''}>
							{setting.fieldLabel}
						</label>
						<input
							type={setting.type || 'text'}
							id={setting.fieldId}
							name={setting.fieldName}
							value={setting.value}
							disabled={!setting.enabled || setting.disabled}
							onChange={setting.onChange}
							min={setting.min}
							max={setting.max}
							className={`pref-input ${setting.type === 'number' ? 'auto-id-delay-input' : ''}`}
						/>
						<span
							className={`question-icon ${props.showTooltip === setting.tooltipKey ? 'active-icon' : ''}`}
							onClick={() => props.setShowTooltip(props.showTooltip === setting.tooltipKey ? null : setting.tooltipKey)}
						>
							?
						</span>
					</div>
				</div>
			))}
		</section>
	)
}

export default SessionPreferencesPanel
