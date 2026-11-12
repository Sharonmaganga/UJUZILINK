import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { boundingBox, distanceKm } from "@/lib/geo";
import { activeWhere } from "@/lib/subscription";
import { areaLabel } from "@/lib/places";

const approx = (n: number) => Math.round(n * 1000) / 1000;

/**
 * GET /api/teachers?lat=..&lng=..&q=tailoring&radius=25
 * Returns verified, subscribed teachers sorted nearest first.
 * Contact details are NOT returned here; they are on the profile page for signed-in users.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // Number(null) is 0, so a missing parameter must be treated as invalid rather than "the equator".
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : NaN;
  const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : NaN;
  const radius = Math.min(Math.max(Number(searchParams.get("radius")) || 25, 1), 200);
  const q = searchParams.get("q")?.trim() ?? "";
  // A comma-separated q matches any of the terms (used by skill categories); a plain q behaves as before.
  const terms = q.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const box = boundingBox(lat, lng, radius);
  const teachers = await prisma.teacherProfile.findMany({
    where: {
      ...activeWhere(),
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
      ...(terms.length
        ? {
            AND: [
              {
                OR: terms.flatMap((t) => [
                  { skill: { contains: t, mode: "insensitive" as const } },
                  { otherSkills: { has: t.toLowerCase() } },
                  { bio: { contains: t, mode: "insensitive" as const } },
                  { businessName: { contains: t, mode: "insensitive" as const } },
                ]),
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      skill: true,
      otherSkills: true,
      bio: true,
      businessName: true,
      address: true,
      latitude: true,
      longitude: true,
      profilePhotoUrl: true,
      premisesPhotoUrls: true,
      user: { select: { name: true } },
    },
    take: 500,
  });

  const results = teachers
    .map((t) => ({
      id: t.id,
      name: t.user.name,
      skill: t.skill,
      otherSkills: t.otherSkills,
      bio: t.bio.length > 160 ? t.bio.slice(0, 157) + "..." : t.bio,
      businessName: t.businessName,
      address: t.address,
      area: areaLabel(t.latitude, t.longitude),
      // Public pins are approximate (about 100 m); distance is still computed from the exact point.
      latitude: approx(t.latitude),
      longitude: approx(t.longitude),
      profilePhotoUrl: t.profilePhotoUrl,
      coverUrl: t.premisesPhotoUrls[0] ?? null,
      distanceKm: Math.round(distanceKm(lat, lng, t.latitude, t.longitude) * 10) / 10,
    }))
    .filter((t) => t.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 50);

  return NextResponse.json({ results });
}
