"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

type Phase =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "waiting"; paymentId: string; message: string }
  | { kind: "success"; receipt: string | null }
  | { kind: "failed"; message: string }
  | { kind: "cancelled" }
  | { kind: "timeout" }
  | { kind: "error"; message: string };

const POLL_MS = 3000;
const GIVE_UP_MS = 120_000;

/** Starts an M-Pesa STK push and follows the payment until Safaricom reports back. */
export default function PayButton({ defaultPhone, price }: { defaultPhone: string; price: number }) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const started = useRef(0);

  async function pay() {
    setPhase({ kind: "sending" });
    try {
      const res = await fetch("/api/mpesa/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok || (res.status === 409 && data.paymentId)) {
        started.current = Date.now();
        setPhase({ kind: "waiting", paymentId: data.paymentId, message: data.message ?? data.error });
      } else {
        setPhase({ kind: "error", message: data.error ?? "Could not start the payment." });
      }
    } catch {
      setPhase({ kind: "error", message: "No connection. Check your internet and try again." });
    }
  }

  useEffect(() => {
    if (phase.kind !== "waiting") return;
    const timer = setInterval(async () => {
      if (Date.now() - started.current > GIVE_UP_MS) {
        setPhase({ kind: "timeout" });
        return;
      }
      try {
        const res = await fetch(`/api/mpesa/status?id=${encodeURIComponent(phase.paymentId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const p = await res.json();
        if (p.status === "SUCCESS") {
          setPhase({ kind: "success", receipt: p.mpesaReceipt });
          router.refresh();
        } else if (p.status === "CANCELLED") setPhase({ kind: "cancelled" });
        else if (p.status === "FAILED") setPhase({ kind: "failed", message: p.resultDesc ?? "The payment did not go through." });
      } catch {
        /* keep polling through brief network drops */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase, router]);

  const busy = phase.kind === "sending" || phase.kind === "waiting";

  return (
    <div className="stack">
      <label className="field">
        <span>M-Pesa number</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" disabled={busy} />
        <span className="hint">You&apos;ll get a prompt on this phone to enter your M-Pesa PIN.</span>
      </label>

      <div aria-live="polite" className="stack">
        {phase.kind === "waiting" && (
          <div className="pay-state waiting">
            <span className="icon-tile"><Icon name="phoneDevice" /></span>
            <div>
              <strong>Check your phone</strong>
              <p className="small muted" style={{ margin: "2px 0 0" }}>{phase.message || "Enter your M-Pesa PIN to confirm."} Waiting for confirmation…</p>
            </div>
          </div>
        )}
        {phase.kind === "success" && (
          <div className="pay-state success">
            <span className="icon-tile"><Icon name="check" /></span>
            <div>
              <strong>Payment received</strong>
              <p className="small" style={{ margin: "2px 0 0" }}>Your listing has been extended.{phase.receipt ? ` Receipt ${phase.receipt}.` : ""}</p>
            </div>
          </div>
        )}
        {phase.kind === "cancelled" && (
          <div className="pay-state cancelled">
            <span className="icon-tile"><Icon name="x" /></span>
            <div><strong>Payment cancelled</strong><p className="small" style={{ margin: "2px 0 0" }}>The prompt was dismissed. Nothing was charged.</p></div>
          </div>
        )}
        {phase.kind === "failed" && (
          <div className="pay-state failed">
            <span className="icon-tile"><Icon name="alert" /></span>
            <div><strong>Payment failed</strong><p className="small" style={{ margin: "2px 0 0" }}>{phase.message}</p></div>
          </div>
        )}
        {phase.kind === "timeout" && (
          <div className="pay-state">
            <span className="icon-tile amber"><Icon name="clock" /></span>
            <div>
              <strong>Still waiting for M-Pesa</strong>
              <p className="small muted" style={{ margin: "2px 0 0" }}>If you paid, it will appear in your history shortly. If not, you can try again.</p>
            </div>
          </div>
        )}
        {phase.kind === "error" && (
          <div className="alert"><Icon name="alert" /><p style={{ margin: 0 }}>{phase.message}</p></div>
        )}
      </div>

      <div>
        <button className="btn amber lg" onClick={pay} disabled={busy}>
          {busy ? (
            <><Icon name="loader" className="spin" /> {phase.kind === "sending" ? "Sending request…" : "Waiting for PIN…"}</>
          ) : (
            <>{phase.kind === "idle" || phase.kind === "success" ? `Pay KES ${price} with M-Pesa` : "Try again"}</>
          )}
        </button>
      </div>
    </div>
  );
}
