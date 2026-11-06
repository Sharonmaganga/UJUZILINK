import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { LOCAL_UPLOAD_DIR } from "@/lib/upload";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic" };

/** Serves locally stored uploads (development only; production uses Vercel Blob). ID photos are admin-only. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const file = path.join(LOCAL_UPLOAD_DIR, ...parts);
  if (!file.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response("Not found", { status: 404 });

  if (parts[0] === "ids") {
    const session = await getSession();
    if (session?.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  }
  try {
    const data = await readFile(file);
    const ext = file.split(".").pop() ?? "";
    return new Response(new Uint8Array(data), { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
