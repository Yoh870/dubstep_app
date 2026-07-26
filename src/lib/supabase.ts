// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export async function uploadMusic(
  file: File
): Promise<{ url: string; error?: string }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { url: "", error: "Supabase not configured" };
  }

  try {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("music")
      .upload(`uploads/${filename}`, file);

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("music")
      .getPublicUrl(`uploads/${filename}`);

    return { url: publicUrl.publicUrl };
  } catch (err) {
    return { url: "", error: String(err) };
  }
}

export async function getTracks() {
  try {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching tracks:", err);
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
          createdAt: new Date(),
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error("Error saving track:", err);
    return null;
  }
}

export async function deleteTrack(id: string) {
  try {
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting track:", err);
    return false;
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
          ...playlist,
          createdAt: new Date(),
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
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching playlists:", err);
    return [];
  }
}