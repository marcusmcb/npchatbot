import '../App.css'

const SessionPanel = () => {
	return (
		<div className='app-container-column'>
			{/* <div className='app-form-title'>Information:</div> */}
			<div className='app-form-title start-chatbot'>Chatbot Controls:</div>
			<div>
				<button className='bot-control-button' type='submit'>
					Connect
				</button>
				<button className='bot-control-button' type='submit'>
					End Session
				</button>
			</div>
			<div className='app-form-title session-info'>Session Info:</div>
			<div className='session-info-label'>
				Status:<span className='session-info-status'>not connected</span>
			</div>
			<div className='session-info-label'>
				Uptime:<span className='session-info-status'>x hours & x mins</span>
			</div>
		</div>
	)
}

export default SessionPanel