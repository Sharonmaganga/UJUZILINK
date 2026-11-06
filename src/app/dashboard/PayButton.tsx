"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayButton({ defaultPhone, price }: { defaultPhone: string; price: number }) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/mpesa/stk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? { ok: true, text: `${data.message}. This page will update once the payment goes through.` } : { ok: false, text: data.error });
    if (res.ok) setTimeout(() => router.refresh(), 20000);
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <label>
        M-Pesa number
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
      </label>
      <div>
        <button className="btn brand" onClick={pay} disabled={loading}>
          {loading ? "Sending request..." : `Pay KES ${price} with M-Pesa`}
        </button>
      </div>
      {msg && <div className={msg.ok ? "alert ok" : "alert"}>{msg.text}</div>}
    </div>
  );
}
