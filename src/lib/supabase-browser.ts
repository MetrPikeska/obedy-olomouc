"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "obedy-auth" },
  });
  return client;
}

/** Downscale a photo in the browser to max 1600 px WebP (falls back to JPEG). */
export async function shrinkImage(file: File, max = 1600): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * scale);
  const height = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const toBlob = (type: string) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.82));
  let blob = await toBlob("image/webp");
  let type = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    // Safari < 17 cannot encode WebP
    blob = await toBlob("image/jpeg");
    type = "image/jpeg";
  }
  if (!blob) throw new Error("Fotku se nepodařilo zpracovat");
  return { blob, width, height, type };
}
