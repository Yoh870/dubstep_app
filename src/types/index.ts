// src/types/index.ts

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  coverUrl?: string;
  source: "upload" | "youtube";
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
}

export interface AudioContextType {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  dataArray: Uint8Array | null;
}

export interface VisualizerMode {
  name: string;
  id: "waveform" | "bars" | "particles" | "3d";
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export interface EQSettings {
  bass: number; // -20 to 20
  mid: number; // -20 to 20
  treble: number; // -20 to 20
}
