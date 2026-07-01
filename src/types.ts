export interface TrackMetadata {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  hasCover: boolean;
  isFavorite: boolean;
  playCount: number;
  lastPlayed?: number;
  cover?: string;
}

export interface TrackBlob {
  id: number;
  audioBlob: Blob;
  coverBlob?: Blob;
}

export interface TrackWithBlobs extends TrackMetadata {
  audioBlob?: Blob;
  coverBlob?: Blob;
}

export interface Playlist {
  id: string; // 'all', 'favorites', 'recently-played', 'most-played', or custom UUID
  name: string;
  description?: string;
  trackIds: number[];
  isCustom?: boolean;
}

export interface QueueItem {
  id: string; // Unique instance ID for list rendering
  trackId: number;
  metadata: TrackMetadata;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  q: number;
}

export interface SleepTimerState {
  totalMinutes: number;
  remainingSeconds: number;
  isActive: boolean;
}

export interface LyricsLine {
  time: number; // seconds
  text: string;
}

export interface UserProfile {
  name: string;
  bio?: string;
  avatarUrl?: string;
  joinDate?: string;
  preferredGenre?: string;
}

export interface SessionState {
  currentTrackId?: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
}
