import { beforeEach, describe, expect, it } from "vitest";
import { mkdir, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { db, resetMocks, session } from "./mocks";

const dir = path.join(os.tmpdir(), `ujuzi-test-${process.pid}`);
process.env.UPLOAD_DIR = dir;

const { GET: getFile } = await import("@/app/files/[...path]/route");
const { GET: searchTeachers } = await import("@/app/api/teachers/route");

const file = (...parts: string[]) => getFile(new Request("http://test"), { params: Promise.resolve({ path: parts }) });

describe("document access", () => {
  beforeEach(async () => {
    resetMocks();
    await mkdir(path.join(dir, "ids"), { recursive: true });
    await mkdir(path.join(dir, "premises"), { recursive: true });
    await writeFile(path.join(dir, "ids", "a.jpg"), "id");
    await writeFile(path.join(dir, "premises", "b.jpg"), "shop");
  });

  it("ID photos are admin-only", async () => {
    expect((await file("ids", "a.jpg")).status).toBe(403);
    session.current = { user: { id: "t", role: "TEACHER", name: "T" } };
    expect((await file("ids", "a.jpg")).status).toBe(403);
    session.current = { user: { id: "a", role: "ADMIN", name: "A" } };
    expect((await file("ids", "a.jpg")).status).toBe(200);
  });

  it("premises photos are public and path traversal is blocked", async () => {
    expect((await file("premises", "b.jpg")).status).toBe(200);
    expect((await file("..", "..", "etc", "passwd")).status).toBe(404);
  });
});

describe("teacher search API", () => {
  beforeEach(resetMocks);

  it("matches any term of a comma-separated category query", async () => {
    db.teacherProfile.findMany.mockResolvedValue([]);
    await searchTeachers(new Request("http://test/api/teachers?lat=-1.28&lng=36.81&q=tailor,sewing"));
    const or = db.teacherProfile.findMany.mock.calls[0][0].where.AND[0].OR;
    expect(or).toHaveLength(8);
    expect(or[0]).toEqual({ skill: { contains: "tailor", mode: "insensitive" } });
    expect(or[4]).toEqual({ skill: { contains: "sewing", mode: "insensitive" } });
  });

  it("requires a location", async () => {
    expect((await searchTeachers(new Request("http://test/api/teachers"))).status).toBe(400);
  });

  it("only queries approved, active teachers, sorts nearest first and hides exact pins and contacts", async () => {
    const base = { otherSkills: [], bio: "bio", businessName: null, address: "Gikomba", profilePhotoUrl: "/p.jpg", premisesPhotoUrls: [], user: { name: "A B" } };
    db.teacherProfile.findMany.mockResolvedValue([
      { ...base, id: "far", skill: "Tailoring", latitude: -1.3, longitude: 36.9 },
      { ...base, id: "near", skill: "Tailoring", latitude: -1.28641234, longitude: 36.81723456 },
    ]);
    const res = await searchTeachers(new Request("http://test/api/teachers?lat=-1.2864&lng=36.8172&radius=25"));
    const { results } = await res.json();

    const where = db.teacherProfile.findMany.mock.calls[0][0].where;
    expect(where.status).toBe("APPROVED");
    expect(where.OR).toEqual([{ trialEndsAt: { gt: expect.any(Date) } }, { paidUntil: { gt: expect.any(Date) } }]);
    expect(results.map((r: { id: string }) => r.id)).toEqual(["near", "far"]);
    expect(results[0].latitude).toBe(-1.286);
    expect(results[0]).not.toHaveProperty("phone");
    expect(results[0]).not.toHaveProperty("idNumber");
  });
});
