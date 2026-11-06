/** Minimal Safaricom Daraja client for Lipa na M-Pesa Online (STK push). */

const BASE =
  process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

export function mpesaConfigured() {
  return !!(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_SHORTCODE &&
    process.env.MPESA_PASSKEY &&
    process.env.MPESA_CALLBACK_URL
  );
}

async function accessToken(): Promise<string> {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed (${res.status})`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function timestamp() {
  // YYYYMMDDHHmmss in East Africa Time
  const eat = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return eat.toISOString().replace(/[-T:]/g, "").slice(0, 14);
}

export async function stkPush(opts: { phone: string; amount: number; reference: string; description: string }) {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString("base64");
  const callback = new URL(process.env.MPESA_CALLBACK_URL!);
  if (process.env.MPESA_CALLBACK_TOKEN) callback.searchParams.set("token", process.env.MPESA_CALLBACK_TOKEN);

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: opts.amount,
      PartyA: opts.phone,
      PartyB: shortcode,
      PhoneNumber: opts.phone,
      CallBackURL: callback.toString(),
      AccountReference: opts.reference.slice(0, 12),
      TransactionDesc: opts.description.slice(0, 13),
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as {
    CheckoutRequestID?: string;
    ResponseCode?: string;
    errorMessage?: string;
    CustomerMessage?: string;
  };
  if (!res.ok || data.ResponseCode !== "0" || !data.CheckoutRequestID) {
    throw new Error(data.errorMessage ?? "M-Pesa request failed");
  }
  return { checkoutRequestId: data.CheckoutRequestID, message: data.CustomerMessage };
}
