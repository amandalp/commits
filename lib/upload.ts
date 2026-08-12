"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Upload an image or video to the public `media` bucket and return its public URL.
 * Runs in the browser with the user's authenticated Supabase session.
 */
export async function uploadMedia(
  file: File,
  folder: "avatars" | "updates" | "proof" | "commits"
): Promise<{ url: string } | { error: string }> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  // Avatars stay image-only; everywhere else accepts photo or video.
  if (folder === "avatars" ? !isImage : !isImage && !isVideo)
    return {
      error:
        folder === "avatars"
          ? "Please choose an image file."
          : "Please choose an image or video file.",
    };
  if (isImage && file.size > MAX_IMAGE_BYTES)
    return { error: "Image must be under 8MB." };
  if (isVideo && file.size > MAX_VIDEO_BYTES)
    return { error: "Video must be under 50MB." };

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
