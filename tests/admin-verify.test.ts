import { beforeEach, describe, expect, it } from "vitest";
import { db, json, resetMocks, session } from "./mocks";
import { POST } from "@/app/api/admin/verify/route";

const URL_ = "http://test/api/admin/verify";
const admin = { user: { id: "admin1", role: "ADMIN", name: "Admin" } };

describe("admin verification", () => {
  beforeEach(resetMocks);

  it("refuses non-admins", async () => {
    session.current = { user: { id: "u1", role: "TEACHER", name: "T" } };
    const res = await POST(json(URL_, { teacherId: "t1", action: "approve" }));
    expect(res.status).toBe(403);
    expect(db.teacherProfile.update).not.toHaveBeenCalled();
  });

  it("approval starts the free trial the first time and is audited", async () => {
    session.current = admin;
    db.teacherProfile.findUnique.mockResolvedValue({ id: "t1", status: "PENDING", trialEndsAt: null });
    const res = await POST(json(URL_, { teacherId: "t1", action: "approve" }));
    expect(res.status).toBe(200);
    const data = db.teacherProfile.update.mock.calls[0][0].data;
    expect(data.status).toBe("APPROVED");
    expect(data.trialEndsAt).toBeInstanceOf(Date);
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: "admin1", action: "teacher.approve", targetId: "t1" }) });
  });

  it("re-approval does not grant a second free trial", async () => {
    session.current = admin;
    const used = new Date("2026-01-01");
    db.teacherProfile.findUnique.mockResolvedValue({ id: "t1", status: "REJECTED", trialEndsAt: used });
    await POST(json(URL_, { teacherId: "t1", action: "approve" }));
    expect(db.teacherProfile.update.mock.calls[0][0].data.trialEndsAt).toBe(used);
  });

  it("rejection requires a reason", async () => {
    session.current = admin;
    db.teacherProfile.findUnique.mockResolvedValue({ id: "t1", status: "PENDING", trialEndsAt: null });
    expect((await POST(json(URL_, { teacherId: "t1", action: "reject" }))).status).toBe(400);
    expect((await POST(json(URL_, { teacherId: "t1", action: "reject", reason: "ID photo is blurry" }))).status).toBe(200);
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "teacher.reject", detail: "ID photo is blurry" }) });
  });

  it("only approved teachers can be revoked", async () => {
    session.current = admin;
    db.teacherProfile.findUnique.mockResolvedValue({ id: "t1", status: "PENDING", trialEndsAt: null });
    expect((await POST(json(URL_, { teacherId: "t1", action: "revoke", reason: "x" }))).status).toBe(409);
  });
});
