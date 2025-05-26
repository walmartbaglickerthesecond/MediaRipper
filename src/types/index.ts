export type Platform = 'youtube' | 'spotify';

export type MediaFormat = 'mp3' | 'mp4';

export type MediaQuality = 'low' | 'medium' | 'high';

export interface DownloadItem {
  id: string;
  url: string;
  platform: Platform;
  format: MediaFormat;
  quality: MediaQuality;
  title: string;
  thumbnail?: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  timestamp: number;
}

export interface FormState {
  url: string;
  platform: Platform;
  format: MediaFormat;
  quality: MediaQuality;
}