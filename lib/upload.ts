"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Upload an image to the public `media` bucket and return its public URL.
 * Runs in the browser with the user's authenticated Supabase session.
 */
export async function uploadMedia(
  file: File,
  folder: "avatars" | "updates" | "proof"
): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_BYTES) return { error: "Image must be under 8MB." };
  if (!file.type.startsWith("image/"))
    return { error: "Please choose an image file." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${folder}/${user.id}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { error: error.message };

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}
