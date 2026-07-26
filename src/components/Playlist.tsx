import type { Track } from "@/types";
import { Play, RotateCcw, Trash2 } from "lucide-react";

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onDeleteTrack: (track: Track) => void;
  onResetPlaylist: () => void;
  isDeleting: boolean;
}

export default function Playlist({
  tracks,
  currentIndex,
  onSelectTrack,
  onDeleteTrack,
  onResetPlaylist,
  isDeleting,
}: PlaylistProps) {
  if (tracks.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center text-slate-400">
        No tracks yet. Upload your first track!
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">Playlist ({tracks.length})</h3>
        <button
          type="button"
          onClick={onResetPlaylist}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onSelectTrack(index)}
            className={`p-4 border-b border-slate-700/50 cursor-pointer transition-colors ${
              index === currentIndex
                ? "bg-purple-600/20 border-l-4 border-l-purple-500"
                : "hover:bg-slate-700/30"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-700 rounded flex-shrink-0 flex items-center justify-center">
                {index === currentIndex ? (
                  <Play size={16} className="text-purple-400 fill-purple-400" />
                ) : (
                  <span className="text-xs text-slate-400">{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${index === currentIndex ? "text-purple-400" : "text-white"}`}>
                  {track.title}
                </p>
                <p className="text-sm text-slate-400 truncate">{track.artist}</p>
              </div>

              <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded flex-shrink-0">
                {track.source === "upload" ? "📁" : "🎬"}
              </span>
              <button
                type="button"
                aria-label={`Delete ${track.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteTrack(track);
                }}
                disabled={isDeleting}
                className="rounded p-2 text-slate-400 transition-colors hover:bg-red-600/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
