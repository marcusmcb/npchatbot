// src/types.ts
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

export interface ReportData {
  dj_name: string;
  set_start_time: string;
  playlist_date: string;
  set_length: string;
  set_length_hours: number;
  set_length_minutes: number;
  set_length_seconds: number;
  average_track_length: string;
  shortest_track_name: string;
  shortest_track_length: string;
  shortest_track_minutes: number;
  shortest_track_seconds: number;
  longest_track_name: string;
  longest_track_length: string;
  longest_track_minutes: number;
  longest_track_seconds: number;
  total_tracks_played: number;
  doubles_played: DoublePlayed[];
  top_three_longest: LongSongPlayed[];
  top_three_shortest: ShortSongPlayed[]; 
}
