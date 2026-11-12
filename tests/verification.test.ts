import { beforeEach, describe, expect, it } from "vitest";
import os from "os";
import path from "path";
import { db, resetMocks, session } from "./mocks";
import { validateStep } from "@/lib/teacherForm";

process.env.UPLOAD_DIR = path.join(os.tmpdir(), `ujuzi-draft-${process.pid}`);
const { POST: saveDraft } = await import("@/app/api/teacher/draft/route");
const { POST: submitProfile } = await import("@/app/api/teacher/profile/route");

const teacher = { user: { id: "u1", role: "TEACHER", name: "T" } };
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1]);
const photo = (name = "a.jpg") => new File([JPEG], name, { type: "image/jpeg" });
const multipart = (url: string, entries: [string, string | File][]) => {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return new Request(url, { method: "POST", body: fd });
};
const none = { hasIdPhoto: false, hasProfilePhoto: false, premisesCount: 0 };

describe("verification step rules", () => {
  it("step 1 needs name, skill, intro and a Kenyan phone", () => {
    expect(Object.keys(validateStep(1, {}, none)).sort()).toEqual(["bio", "name", "phone", "skill"]);
    expect(validateStep(1, { name: "Jane W", skill: "Tailoring", bio: "Twelve years running a tailoring stall.", phone: "0712345678" }, none)).toEqual({});
    expect(validateStep(1, { name: "Jane W", skill: "Tailoring", bio: "Twelve years running a tailoring stall.", phone: "0712345678", whatsapp: "123" }, none)).toHaveProperty("whatsapp");
  });
  it("step 2 needs an ID number and both photos", () => {
    expect(Object.keys(validateStep(2, { idNumber: "12 34" }, none)).sort()).toEqual(["idNumber", "idPhoto", "profilePhoto"]);
    expect(validateStep(2, { idNumber: "A1234567" }, { ...none, hasIdPhoto: true, hasProfilePhoto: true })).toEqual({});
  });
  it("step 3 needs an address and a pin; step 4 needs 1-6 photos", () => {
    expect(validateStep(3, { address: "Gikomba" }, none)).toHaveProperty("latitude");
    expect(validateStep(3, { address: "Gikomba", latitude: -1.28, longitude: 36.8 }, none)).toEqual({});
    expect(validateStep(4, {}, none)).toHaveProperty("premisesPhotos");
    expect(validateStep(4, {}, { ...none, premisesCount: 7 })).toHaveProperty("premisesPhotos");
  });
});

describe("draft API", () => {
  beforeEach(resetMocks);

  it("refuses non-teachers", async () => {
    session.current = { user: { id: "u2", role: "LEARNER", name: "L" } };
    expect((await saveDraft(multipart("http://t/api/teacher/draft", [["name", "x"]]))).status).toBe(403);
  });

  it("rejects an invalid step without saving anything", async () => {
    session.current = teacher;
    db.teacherDraft.findUnique.mockResolvedValue(null);
    db.teacherProfile.findUnique.mockResolvedValue(null);
    const res = await saveDraft(multipart("http://t/api/teacher/draft", [["step", "1"], ["name", "J"]]));
    expect(res.status).toBe(400);
    expect((await res.json()).errors).toHaveProperty("name");
    expect(db.teacherDraft.upsert).not.toHaveBeenCalled();
  });

  it("saves identity photos and never returns the ID photo URL", async () => {
    session.current = teacher;
    db.teacherDraft.findUnique.mockResolvedValue({ data: {}, idPhotoUrl: null, profilePhotoUrl: null, premisesPhotoUrls: [] });
    db.teacherProfile.findUnique.mockResolvedValue(null);
    db.teacherDraft.upsert.mockImplementation(async ({ update }) => ({ data: update.data, idPhotoUrl: update.idPhotoUrl, profilePhotoUrl: update.profilePhotoUrl, premisesPhotoUrls: [] }));
    const res = await saveDraft(
      multipart("http://t/api/teacher/draft", [["step", "2"], ["idNumber", "12345678"], ["idPhoto", photo()], ["profilePhoto", photo("me.jpg")]]),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.draft.hasIdPhoto).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/\/files\/ids\//);
    expect(db.teacherDraft.upsert.mock.calls[0][0].update.idPhotoUrl).toMatch(/^\/files\/ids\/.+\.jpg$/);
  });

  it("rejects a fake image before storing any photo", async () => {
    session.current = teacher;
    db.teacherDraft.findUnique.mockResolvedValue(null);
    db.teacherProfile.findUnique.mockResolvedValue(null);
    const fake = new File(["<script>alert(1)</script>"], "x.jpg", { type: "image/jpeg" });
    const res = await saveDraft(multipart("http://t/api/teacher/draft", [["idPhoto", photo()], ["profilePhoto", fake]]));
    expect(res.status).toBe(400);
    expect(db.teacherDraft.upsert).not.toHaveBeenCalled();
  });
});

describe("final submission", () => {
  beforeEach(resetMocks);

  it("builds the profile from draft photos, goes to review, and removes the draft", async () => {
    session.current = teacher;
    db.teacherProfile.findUnique.mockResolvedValue(null);
    db.teacherDraft.findUnique.mockResolvedValue({ data: {}, idPhotoUrl: "/files/ids/d.jpg", profilePhotoUrl: "/files/profiles/d.jpg", premisesPhotoUrls: ["/files/premises/d.jpg"] });
    const res = await submitProfile(
      multipart("http://t/api/teacher/profile", [
        ["name", "Jane Wanjiru"], ["skill", "Tailoring"], ["bio", "Twelve years running a tailoring stall."], ["phone", "0712345678"],
        ["address", "Gikomba Market"], ["latitude", "-1.28"], ["longitude", "36.83"], ["idNumber", "12345678"],
      ]),
    );
    expect(res.status).toBe(200);
    const created = db.teacherProfile.upsert.mock.calls[0][0].create;
    expect(created.status).toBe("PENDING");
    expect(created.idPhotoUrl).toBe("/files/ids/d.jpg");
    expect(created.premisesPhotoUrls).toEqual(["/files/premises/d.jpg"]);
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { name: "Jane Wanjiru" } });
    expect(db.teacherDraft.delete).toHaveBeenCalled();
  });
});
