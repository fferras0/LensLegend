export type Language = 'en' | 'ar';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface LandmarkData {
  name: string;
  description: string;
  sources: GroundingSource[];
  audioBuffer?: AudioBuffer; // Decoded audio ready to play
  originalImage: string; // Base64
  language: Language;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  FETCHING_INFO = 'FETCHING_INFO',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  SHOWING_RESULT = 'SHOWING_RESULT',
  ERROR = 'ERROR'
}

export interface ErrorState {
  message: string;
}