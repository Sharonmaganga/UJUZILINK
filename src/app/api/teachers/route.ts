import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { boundingBox, distanceKm } from "@/lib/geo";
import { activeWhere } from "@/lib/subscription";

/**
 * GET /api/teachers?lat=..&lng=..&q=tailoring&radius=25
 * Returns verified, subscribed teachers sorted nearest first.
 * Contact details are NOT returned here; they are on the profile page for signed-in users.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Math.max(Number(searchParams.get("radius")) || 25, 1), 200);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const box = boundingBox(lat, lng, radius);
  const teachers = await prisma.teacherProfile.findMany({
    where: {
      ...activeWhere(),
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
      ...(q
        ? {
            AND: [
              {
                OR: [
                  { skill: { contains: q, mode: "insensitive" as const } },
                  { otherSkills: { has: q.toLowerCase() } },
                  { bio: { contains: q, mode: "insensitive" as const } },
                  { businessName: { contains: q, mode: "insensitive" as const } },
                ],
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
      latitude: t.latitude,
      longitude: t.longitude,
      profilePhotoUrl: t.profilePhotoUrl,
      distanceKm: Math.round(distanceKm(lat, lng, t.latitude, t.longitude) * 10) / 10,
    }))
    .filter((t) => t.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 50);

  return NextResponse.json({ results });
}
