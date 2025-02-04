export interface BotProcessResponse {
  success: boolean
  message?: any
  error?: string
}

export interface AuthSuccess {
  _id: string
  twitchRefreshToken: string
}

export interface MessagePanelProps {
	message: string
	error: string
	showTooltip: string | null
}

export interface TitleBarProps {
	isTwitchAuthorized: boolean
	isBotConnected: boolean
}

export type CredentialsFieldConfig = {
	id: string
	label: string
	name: keyof CredentialsPanelProps['formData']
	placeholder?: string
}

export type CredentialsPanelProps = {
	formData: {
		twitchChannelName: string
		twitchChatbotName: string
		seratoDisplayName: string
		obsWebsocketAddress?: string
		obsWebsocketPassword?: string
	}
	handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
	showTooltip: string | null
	setShowTooltip: (value: string | null) => void
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void
	isBotConnected: boolean
	isObsResponseEnabled: boolean
	isTwitchAuthorized: boolean
	isFormModified: boolean
}

export interface SessionPanelProps {
  handleConnect: (event: React.MouseEvent<HTMLButtonElement>) => void
  handleDisconnect: (event: React.MouseEvent<HTMLButtonElement>) => void	
  validateLivePlaylist: (event: React.MouseEvent<HTMLButtonElement>) => void
  setReportView: (value: boolean) => void
  reportView: boolean
  isBotConnected: boolean
  isTwitchAuthorized: boolean
  isConnectionReady: boolean
  isReportReady: boolean
  reportData: ReportData | null	
}

export interface DoublePlayed {
  name: string;  
}

export interface LongSongPlayed {
  name: string;
  length: string;
}

export interface ShortSongPlayed {
  name: string;
  length: string;
}

export interface npSongQueried {
  name: string;
}

export interface dypSearchTerm {
  name: string;
}

export interface ReportData {
  dj_name: string;
  set_start_time: string;
  playlist_date: string;
  set_length: string;
  set_length_hours: number;
  set_length_minutes: number;
  set_length_seconds: number;
  average_track_length_minutes: string;
  average_track_length_seconds: string;
  // shortest_track_name: string;
  // shortest_track_length: string;
  // shortest_track_minutes: number;
  // shortest_track_seconds: number;
  // longest_track_name: string;
  // longest_track_length: string;
  // longest_track_minutes: number;
  // longest_track_seconds: number;
  total_tracks_played: number;
  doubles_played: DoublePlayed[];
  // top_three_longest: LongSongPlayed[];
  // top_three_shortest: ShortSongPlayed[]; 
  np_songs_queried: npSongQueried[];
  dyp_search_terms: dypSearchTerm[];
}

export interface ReportDataProps {
	reportData: ReportData | null
	setReportView: (value: boolean) => void
}
