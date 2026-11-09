import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_PREMISES_PHOTOS = 6;

/** Where photos are kept when Blob storage isn't used. On RumptyCloud, point this at a persistent disk, e.g. /data/uploads. */
export const LOCAL_UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), ".uploads"));

export class UploadError extends Error {}

type ImageType = "image/jpeg" | "image/png" | "image/webp" | "image/heic";
const EXT: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"]);

/**
 * Identifies an image from its first bytes rather than trusting the browser-supplied MIME type,
 * so a renamed script or HTML file can't be stored and served as a "photo".
 */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 4) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a) return "image/png";
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp" && HEIC_BRANDS.has(ascii(8, 12))) return "image/heic";
  return null;
}

/** Throws UploadError if the file is too large or not a real image. Lets callers check every file before saving any. */
export async function assertImage(file: File): Promise<void> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name}: photos must be under 5 MB`);
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniffImageType(head)) throw new UploadError(`${file.name}: only JPG, PNG, WEBP or HEIC photos are allowed`);
}

/**
 * Saves an uploaded image and returns its URL.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise writes to UPLOAD_DIR (default .uploads/)
 * and serves files through /files/... (where the "ids" folder is admin-only).
 */
export async function saveImage(file: File, folder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`${file.name}: photos must be under 5 MB`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) throw new UploadError(`${file.name}: only JPG, PNG, WEBP or HEIC photos are allowed`);

  const name = `${folder}/${randomUUID()}.${EXT[type]}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    // NOTE: Blob URLs are public but unguessable. For strict ID privacy prefer disk storage (UPLOAD_DIR).
    const blob = await put(name, new Blob([bytes], { type }), { access: "public", contentType: type });
    return blob.url;
  }

  await mkdir(path.join(LOCAL_UPLOAD_DIR, folder), { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, name), bytes);
  return `/files/${name}`;
}
