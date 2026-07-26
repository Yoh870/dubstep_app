# 🎵 Dubstep Music App - Setup Guide

## Project Structure

```
dubstep-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (main player)
│   │   ├── globals.css
│   │   └── api/
│   │       ├── youtube/
│   │       │   └── route.ts (YouTube download)
│   │       └── upload/
│   │           └── route.ts (MP3 upload)
│   ├── components/
│   │   ├── MusicPlayer.tsx
│   │   ├── Visualizer.tsx
│   │   ├── Playlist.tsx
│   │   ├── NowPlaying.tsx
│   │   ├── Controls.tsx
│   │   └── Equalizer.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── audioContext.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       ├── useAudio.ts
│       ├── useVisualizer.ts
│       └── usePlaylist.ts
├── public/
│   └── dubstep.svg (logo)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## Installation Steps

### 1. Create Next.js Project
```bash
npx create-next-app@latest dubstep-app --typescript --tailwind
cd dubstep-app
```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js
npm install axios
npm install lucide-react
npm install zustand (for state management)
```

### 3. Setup Supabase
- Create new project at https://supabase.com
- Create table: `tracks` (id, title, artist, url, duration, created_at)
- Create table: `playlists` (id, name, tracks, created_at)
- Create storage bucket: `music` (for MP3 uploads)

### 4. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
YOUTUBE_API_KEY=your_youtube_api_key
```

### 5. Setup YouTube API
- Go to https://console.cloud.google.com
- Create project
- Enable YouTube Data API v3
- Create API key
- Add to `.env.local`

---

## Features to Build

### Phase 1 - MVP (This Week)
- ✅ Music Player (play/pause/next/prev)
- ✅ Upload MP3 files
- ✅ Basic Visualizer (Canvas waveform)
- ✅ Playlist management
- ✅ Now Playing display

### Phase 2 - Enhanced
- ✅ YouTube integration
- ✅ Equalizer controls
- ✅ Multiple visualizer modes
- ✅ BPM detector
- ✅ Favorites/Bookmarks

### Phase 3 - Advanced
- ✅ DJ Mixer (crossfade, tempo)
- ✅ 3D Visualizer (Three.js)
- ✅ Audio effects (reverb, delay)
- ✅ Social sharing

---

## Tech Stack Summary
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Canvas 2D
- **Backend:** Supabase (database + storage)
- **Audio:** Web Audio API
- **Visualization:** Canvas 2D, (Optional: Three.js later)
- **State:** Zustand

---

**Ready to start coding?** 🚀
