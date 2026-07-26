// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";
import type { Track } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
  );
}

if (!/^https?:\/\//i.test(supabaseUrl)) {
  throw new Error(
    `Invalid Supabase URL: ${supabaseUrl}. It must be a valid HTTP or HTTPS URL.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type DatabaseTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  source: "upload" | "youtube";
  created_at: string;
};

function toTrack(track: DatabaseTrack) {
  return {
    ...track,
    createdAt: track.created_at,
  };
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return String(error);
}

// Helper functions
export async function uploadMusic(
  file: File
): Promise<{ url: string; error?: string }> {
  try {
    const extension = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const path = `uploads/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("music")
      .upload(path, file, { contentType: file.type || "audio/mpeg" });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("music")
      .getPublicUrl(path);

    return { url: publicUrl.publicUrl };
  } catch (err) {
    return { url: "", error: getErrorMessage(err) };
  }
}

export async function getTracks() {
  try {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as DatabaseTrack[] | null)?.map(toTrack) || [];
  } catch (err) {
    // Log detailed error information to help debug Supabase responses
    console.error("Error fetching tracks:", err);
    try {
      console.error("Error (stringified):", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    } catch {
      // ignore stringify errors
    }
    return [];
  }
}

export async function saveTrack(track: {
  title: string;
  artist: string;
  url: string;
  duration: number;
  source: "upload" | "youtube";
}) {
  try {
    const { data, error } = await supabase
      .from("tracks")
      .insert([
        {
          ...track,
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0] ? toTrack(data[0] as DatabaseTrack) : null;
  } catch (err) {
    console.error("Error saving track:", err);
    return null;
  }
}

function getStoragePath(url: string) {
  const pathname = new URL(url).pathname;
  const bucketPrefix = "/storage/v1/object/public/music/";
  const pathIndex = pathname.indexOf(bucketPrefix);

  return pathIndex === -1 ? null : decodeURIComponent(pathname.slice(pathIndex + bucketPrefix.length));
}

export async function deleteTrack(track: Track): Promise<{ success: boolean; error?: string }> {
  try {
    if (track.source === "upload") {
      const storagePath = getStoragePath(track.url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage.from("music").remove([storagePath]);
        if (storageError) throw storageError;
      }
    }

    const { error } = await supabase.from("tracks").delete().eq("id", track.id);
    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("Error deleting track:", err);
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function savePlaylist(playlist: {
  name: string;
  trackIds: string[];
}) {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .insert([
        {
          name: playlist.name,
          track_ids: playlist.trackIds,
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error("Error saving playlist:", err);
    return null;
  }
}

export async function getPlaylists() {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching playlists:", err);
    return [];
  }
}
