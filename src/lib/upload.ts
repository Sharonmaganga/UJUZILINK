import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

/** Where photos are kept when Blob storage isn't used. On RumptyCloud, point this at a persistent disk, e.g. /data/uploads. */
export const LOCAL_UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), ".uploads"));

export class UploadError extends Error {}

/**
 * Saves an uploaded image and returns its public URL.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set (needed in production),
 * otherwise writes to UPLOAD_DIR (default .uploads/) and serves them through /files/...
 */
export async function saveImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new UploadError(`${file.name}: only JPG, PNG, WEBP or HEIC photos are allowed`);
  if (file.size > MAX_BYTES) throw new UploadError(`${file.name}: photos must be under 5 MB`);

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${folder}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    // ID photos are stored with an unguessable random name.
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return blob.url;
  }

  await mkdir(path.join(LOCAL_UPLOAD_DIR, folder), { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/files/${name}`;
}
