import { beforeEach, describe, expect, it } from "vitest";
import { db, json, resetMocks } from "./mocks";
import { POST } from "@/app/api/mpesa/callback/route";

const URL_ = "http://test/api/mpesa/callback?token=secret";
const pending = { id: "pay1", teacherId: "t1", amount: 500, status: "PENDING" };

const callback = (resultCode: number, amount = 500) =>
  json(URL_, {
    Body: {
      stkCallback: {
        CheckoutRequestID: "ws_CO_1",
        ResultCode: resultCode,
        ResultDesc: "desc",
        CallbackMetadata: { Item: [{ Name: "Amount", Value: amount }, { Name: "MpesaReceiptNumber", Value: "RCP123" }] },
      },
    },
  });

describe("M-Pesa callback", () => {
  beforeEach(() => {
    resetMocks();
    process.env.MPESA_CALLBACK_TOKEN = "secret";
  });

  it("rejects calls without the shared token", async () => {
    const res = await POST(json("http://test/api/mpesa/callback?token=wrong", {}));
    expect(res.status).toBe(401);
  });

  it("marks success and extends the subscription once", async () => {
    db.payment.findUnique.mockResolvedValue(pending);
    db.payment.updateMany.mockResolvedValue({ count: 1 });
    db.teacherProfile.findUniqueOrThrow.mockResolvedValue({ id: "t1", trialEndsAt: null, paidUntil: null });

    await POST(callback(0));
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "pay1", status: "PENDING" }, data: expect.objectContaining({ status: "SUCCESS" }) }),
    );
    expect(db.teacherProfile.update).toHaveBeenCalledTimes(1);
  });

  it("does not extend twice when a concurrent retry already claimed the payment", async () => {
    db.payment.findUnique.mockResolvedValue(pending);
    db.payment.updateMany.mockResolvedValue({ count: 0 }); // someone else won the claim
    await POST(callback(0));
    expect(db.teacherProfile.update).not.toHaveBeenCalled();
  });

  it("ignores retries for payments that are no longer pending", async () => {
    db.payment.findUnique.mockResolvedValue({ ...pending, status: "SUCCESS" });
    const res = await POST(callback(0));
    expect(res.status).toBe(200);
    expect(db.payment.updateMany).not.toHaveBeenCalled();
    expect(db.teacherProfile.update).not.toHaveBeenCalled();
  });

  it("records a cancelled prompt as CANCELLED", async () => {
    db.payment.findUnique.mockResolvedValue(pending);
    await POST(callback(1032));
    expect(db.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }));
  });

  it("records other errors as FAILED and underpayment as FAILED without extending", async () => {
    db.payment.findUnique.mockResolvedValue(pending);
    await POST(callback(2001));
    expect(db.payment.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));

    db.payment.updateMany.mockResolvedValue({ count: 1 });
    await POST(callback(0, 100));
    expect(db.payment.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
    expect(db.teacherProfile.update).not.toHaveBeenCalled();
  });
});
