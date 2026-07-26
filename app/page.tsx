// src/app/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { deleteTrack, getTracks, uploadMusic, saveTrack } from "@/lib/supabase";
import type { Track } from "@/types";
import Visualizer, { resumeAudioGraph } from "@/components/Visualizer";
import NowPlaying from "@/components/NowPlaying";
import Playlist from "@/components/Playlist";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function loadTracks() {
      const data = await getTracks();
      setTracks(data);
    }

    void loadTracks();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setUploadError("Please choose an audio file.");
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const { url, error } = await uploadMusic(file);
      if (error) {
        setUploadError(`Upload failed: ${error}`);
        return;
      }

      const track = await saveTrack({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Unknown",
        url,
        duration: 0,
        source: "upload",
      });

      if (track) {
        setTracks((currentTracks) => [track, ...currentTracks]);
      } else {
        setUploadError("The audio uploaded, but its track record could not be saved.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Upload failed unexpectedly. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  const currentTrack = tracks[currentTrackIndex];

  const togglePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await resumeAudioGraph(audioRef.current);
          await audioRef.current.play();
        } catch (error) {
          console.error("Playback error:", error);
          setUploadError("This audio file could not be played by your browser.");
        }
      }
    }
  };

  // Keep audio element volume/muted in sync with state and try to auto-play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = false;
  }, [volume]);

  // Ensure audio element will request CORS-enabled resource so WebAudio can access it
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      // set the crossOrigin attribute so the browser requests CORS headers
      audio.crossOrigin = "anonymous";
    } catch {
      // ignore if not supported
    }
  }, []);

  // When the current track changes, reset time/duration and attempt to play if flagged
  useEffect(() => {
    const audio = audioRef.current;
    setCurrentTime(0);
    setDuration(0);

    if (!audio || !currentTrack) return;

    const tryPlay = async () => {
      try {
        await resumeAudioGraph(audio);
        if (isPlaying) await audio.play();
      } catch (err) {
        console.error("Auto-play failed for new track:", err);
      }
    };

    void tryPlay();
  }, [currentTrackIndex]);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  async function handleDeleteTrack(track: Track) {
    if (!window.confirm(`Delete “${track.title}”? This cannot be undone.`)) return;

    setIsDeleting(true);
    setUploadError(null);
    const result = await deleteTrack(track.id);

    if (!result.success) {
      setUploadError(`Could not delete track: ${result.error ?? "Unknown error"}`);
      setIsDeleting(false);
      return;
    }

    const remainingTracks = tracks.filter((item) => item.id !== track.id);
    const nextCurrentIndex = remainingTracks.findIndex((item) => item.id === currentTrack?.id);
    if (currentTrack?.id === track.id) {
      audioRef.current?.pause();
      setCurrentTime(0);
      setDuration(0);
    }
    setTracks(remainingTracks);
    setCurrentTrackIndex(Math.max(0, nextCurrentIndex));
    setIsDeleting(false);
  }

  async function handleResetPlaylist() {
    const trackCount = tracks.length;
    if (!window.confirm(`Delete all ${trackCount} track${trackCount === 1 ? "" : "s"}? This cannot be undone.`)) return;

    setIsDeleting(true);
    setUploadError(null);
    const results = await Promise.all(
      tracks.map((track) => deleteTrack(track.id))
    );
    const failedCount = results.filter((result) => !result.success).length;

    if (failedCount > 0) {
      setUploadError(`${failedCount} track${failedCount === 1 ? "" : "s"} could not be deleted. Please try again.`);
      const data = await getTracks();
      setTracks(data);
    } else {
      audioRef.current?.pause();
      setTracks([]);
      setCurrentTrackIndex(0);
      setCurrentTime(0);
      setDuration(0);
    }
    setIsDeleting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 text-white">
      {/* Audio Element */}
      <audio
        crossOrigin="anonymous"
        ref={audioRef}
        src={currentTrack?.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={nextTrack}
        onError={(e) => {
          console.error("Audio element error:", e.currentTarget.error);
          setUploadError(
            `Playback failed: ${e.currentTarget.error?.message ?? e.currentTarget.error?.code ?? "unknown"}`
          );
        }}
        onCanPlay={() => {
          console.log("Audio can play:", currentTrack?.url);
        }}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            🎵 Dubstep Visualizer
          </h1>
          <p className="text-slate-400">Create playlists, upload tracks, and enjoy epic visualizations</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Visualizer Section */}
          <div className="lg:col-span-2">
            {currentTrack ? (
              <Visualizer audioRef={audioRef} />
            ) : (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-12 text-center h-96 flex flex-col items-center justify-center">
                <p className="text-slate-400 mb-4">No track selected</p>
                <label className="cursor-pointer">
                  <div className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2">
                    <Upload size={20} />
                    Upload First Track
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Now Playing Section */}
          <div className="lg:col-span-1">
            {currentTrack && <NowPlaying track={currentTrack} />}
          </div>
        </div>

        {/* Player Controls */}
        {currentTrack && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = Number(e.target.value);
                  }
                }}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-2">
                <span>{Math.floor(currentTime)}s</span>
                <span>{Math.floor(duration)}s</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={prevTrack}
                className="bg-slate-700 hover:bg-slate-600 p-3 rounded-full transition-colors"
              >
                <SkipBack size={24} />
              </button>

              <button
                onClick={togglePlay}
                className="bg-purple-600 hover:bg-purple-700 p-4 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>

              <button
                onClick={nextTrack}
                className="bg-slate-700 hover:bg-slate-600 p-3 rounded-full transition-colors"
              >
                <SkipForward size={24} />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4">
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const vol = Number(e.target.value);
                  setVolume(vol);
                  if (audioRef.current) {
                    audioRef.current.volume = vol;
                  }
                }}
                className="flex-1 cursor-pointer"
              />
              <span className="text-sm text-slate-400 w-8">{Math.floor(volume * 100)}%</span>
            </div>
          </div>
        )}

        {/* Upload & Playlist Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Upload Track</h3>
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                  <p className="text-slate-300 text-sm">Click to upload MP3</p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              {isUploading && <p className="mt-3 text-sm text-purple-300">Uploading track...</p>}
              {uploadError && <p role="alert" className="mt-3 text-sm text-red-300">{uploadError}</p>}
            </div>
          </div>

          {/* Playlist Section */}
          <div className="lg:col-span-2">
            <Playlist
              tracks={tracks}
              currentIndex={currentTrackIndex}
              onSelectTrack={setCurrentTrackIndex}
              onDeleteTrack={handleDeleteTrack}
              onResetPlaylist={handleResetPlaylist}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
