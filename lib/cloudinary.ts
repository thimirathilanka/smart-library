import "server-only";

import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(cloudName && apiKey && apiSecret);
}

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export function isCloudinaryFile(fileId?: string | null): fileId is string {
  if (!fileId || typeof fileId !== "string") return false;
  return (
    fileId.startsWith("cloudinary:") ||
    fileId.startsWith("https://res.cloudinary.com/") ||
    fileId.startsWith("http://res.cloudinary.com/")
  );
}

function extractPublicIdFromUrl(url: string): string | undefined {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match?.[1];
}

export function parseCloudinaryFileId(fileId: string): { publicId?: string; url: string } {
  if (fileId.startsWith("cloudinary:")) {
    // Format: cloudinary:<publicId>:<secureUrl>
    const parts = fileId.slice("cloudinary:".length).split(":");
    if (parts.length >= 2) {
      const publicId = parts[0];
      const url = parts.slice(1).join(":");
      return { publicId, url };
    }
    const url = fileId.slice("cloudinary:".length);
    return { publicId: extractPublicIdFromUrl(url), url };
  }
  return { publicId: extractPublicIdFromUrl(fileId), url: fileId };
}

export function getCloudinaryUrl(fileId: string): string {
  return parseCloudinaryFileId(fileId).url;
}

export function getCloudinaryDownloadUrl(fileId: string, expiresInSeconds = 7200): string {
  const { publicId, url } = parseCloudinaryFileId(fileId);
  const id = publicId || extractPublicIdFromUrl(url);

  if (id && isCloudinaryConfigured()) {
    try {
      const c = getCloudinary();
      const expiresAt = Math.round(Date.now() / 1000) + expiresInSeconds;
      return c.utils.private_download_url(id, "pdf", {
        resource_type: "raw",
        type: "upload",
        expires_at: expiresAt,
      });
    } catch (err) {
      console.error("Error generating signed Cloudinary download URL:", err);
    }
  }
  return url;
}

export function getCloudinaryFileName(fileId: string): string {
  const { url, publicId } = parseCloudinaryFileId(fileId);
  const target = publicId || url;
  const lastPart = target.split("/").pop() || "document.pdf";
  const clean = lastPart.replace(/^\d+[-_]/, "");
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
}

export async function deleteCloudinaryFile(fileId: string): Promise<boolean> {
  if (!isCloudinaryConfigured()) return false;
  const { publicId, url } = parseCloudinaryFileId(fileId);
  const id = publicId || extractPublicIdFromUrl(url);

  if (!id) return false;

  try {
    const c = getCloudinary();
    const result = await c.uploader.destroy(id, { resource_type: "raw" });
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

export function createCloudinaryUploadSignature(folder = "smart-library/pdfs") {
  if (!isCloudinaryConfigured()) return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const timestamp = Math.round(new Date().getTime() / 1000);

  const c = getCloudinary();
  const signature = c.utils.api_sign_request(
    { timestamp, folder },
    apiSecret!
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature,
  };
}

export async function fetchCloudinaryBytes(fileId: string): Promise<Uint8Array | null> {
  const url = getCloudinaryDownloadUrl(fileId);
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error("Error fetching Cloudinary file bytes:", err);
    return null;
  }
}
