import { createClient } from "./supabase/client";
const supabase=createClient();
function inferFileExtension(contentType: string, uri: string) {
  const loweredType = contentType.toLowerCase();
  if (loweredType.includes("png")) return "png";
  if (loweredType.includes("webp")) return "webp";
  if (loweredType.includes("gif")) return "gif";
  if (loweredType.includes("jpg") || loweredType.includes("jpeg")) return "jpg";

  const cleaned = uri.split("?")[0] ?? uri;
  const match = cleaned.match(/\.([a-z0-9]+)$/i);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  return "jpg";
}

function isAbsoluteAssetUrl(value: string) {
  return /^(https?:\/\/|file:\/\/|content:\/\/|data:)/i.test(value);
}

export function resolveUserLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (isAbsoluteAssetUrl(trimmed)) {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/^\/+/, "");
  const { data } = supabase.storage.from("user_logo").getPublicUrl(normalizedPath);
  return data?.publicUrl ?? null;
}

export async function uploadUserLogoFromUri(
  userId: string,
  imageUri: string,
  mimeType?: string | null,
) {
  const normalizedUserId = typeof userId === "string" ? userId.trim() : "";
  if (!normalizedUserId) {
    throw new Error("User id is required for profile image upload.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to upload profile images.");
  }

  if (session.user.id !== normalizedUserId) {
    throw new Error("Profile image upload is only allowed for your own account.");
  }

  const trimmedUri = imageUri.trim();
  if (!trimmedUri) {
    throw new Error("Image URI is required.");
  }

  const response = await fetch(trimmedUri);
  if (!response.ok) {
    throw new Error(`Unable to read selected image (${response.status}).`);
  }

  const contentType =
    (typeof mimeType === "string" && mimeType.trim()) ||
    response.headers.get("content-type") ||
    "image/jpeg";

  if (!contentType.toLowerCase().includes("image")) {
    throw new Error("Selected file is not an image.");
  }

  const body = await response.arrayBuffer();
  const extension = inferFileExtension(contentType, trimmedUri);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const path = `${normalizedUserId}/${Date.now()}-${randomSuffix}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("user_logo")
    .upload(path, body, {
      contentType,
      // Keep this false so insert policy is enough; upsert can require update policy too.
      upsert: false,
    });

  if (uploadError) {
    if (/row-level security/i.test(uploadError.message)) {
      throw new Error(
        "Upload blocked by Storage RLS. Add INSERT policy for bucket user_logo on your own folder.",
      );
    }
    throw new Error(uploadError.message);
  }

  const { data: publicData } = supabase.storage.from("user_logo").getPublicUrl(path);
  const publicUrl = publicData.publicUrl;
  if (!publicUrl) {
    throw new Error("Failed to generate profile logo URL.");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ user_logo: publicUrl })
    .eq("id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return publicUrl;
}