// src/components/NowPlaying.tsx

import type { Track } from "@/types";

interface NowPlayingProps {
  track: Track;
}

export default function NowPlaying({ track }: NowPlayingProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 backdrop-blur border border-purple-500/30 rounded-2xl p-6 text-center">
      {/* Cover */}
      <div className="w-full aspect-square bg-slate-800 rounded-lg mb-6 flex items-center justify-center border border-slate-700">
        <div className="text-6xl">🎵</div>
      </div>

      {/* Track Info */}
      <h3 className="text-xl font-bold mb-2 text-white truncate">{track.title}</h3>
      <p className="text-slate-400 text-sm mb-4 truncate">{track.artist}</p>

      {/* Tags */}
      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-xs">
          {track.source === "upload" ? "📁 Upload" : "🎬 YouTube"}
        </span>
        <span className="bg-slate-700/30 text-slate-300 px-3 py-1 rounded-full text-xs">
          {track.duration > 0
            ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}`
            : "Live"}
        </span>
      </div>

      {/* Decorative Waveform */}
      <div className="flex items-end justify-center gap-1 h-12 mb-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t w-1"
            style={{
              height: `${20 + ((i * 37) % 80)}%`,
              animation: `pulse 0.5s ease-in-out ${i * 0.05}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Source Badge */}
      <div className="text-xs text-slate-500 bg-slate-800/50 rounded px-3 py-2">
        Added {new Date(track.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
