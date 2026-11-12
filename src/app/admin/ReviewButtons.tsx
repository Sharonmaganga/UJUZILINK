"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

type Action = "approve" | "reject" | "revoke";

const PRESETS = [
  "ID photo is unclear or cropped",
  "Name on ID doesn't match the account",
  "Profile photo doesn't clearly show your face",
  "Premises photos don't show a place of trade",
  "Location pin doesn't match the address",
];

const COPY: Record<Action, { title: string; body: string; cta: string; tone: string }> = {
  approve: {
    title: "Approve this teacher?",
    body: "They'll appear in search straight away. If this is their first approval, their free month starts now.",
    cta: "Approve and list",
    tone: "btn",
  },
  reject: {
    title: "Request changes",
    body: "The teacher sees this reason on their dashboard and can resubmit.",
    cta: "Send back to teacher",
    tone: "btn danger",
  },
  revoke: {
    title: "Revoke listing?",
    body: "The teacher is removed from search immediately. Their paid days are kept if you approve them again.",
    cta: "Revoke listing",
    tone: "btn danger",
  },
};

/** Approve / reject / revoke with a confirmation dialog. Every decision is written to the audit log server-side. */
export default function ReviewButtons({ teacherId, name, actions }: { teacherId: string; name: string; actions: Action[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [action, setAction] = useState<Action>("approve");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function open(a: Action) {
    setAction(a);
    setReason("");
    setError("");
    dialog.current?.showModal();
  }

  async function confirm() {
    if (action !== "approve" && reason.trim().length < 5) {
      setError("Give the teacher a clear reason (at least 5 characters).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, action, reason: action === "approve" ? undefined : reason.trim() }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? "That didn't work. Try again.");
        return;
      }
      dialog.current?.close();
      router.refresh();
    } catch {
      setError("No connection. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const c = COPY[action];

  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        {actions.includes("approve") && (
          <button type="button" className="btn sm" onClick={() => open("approve")}>
            <Icon name="check" /> Approve
          </button>
        )}
        {actions.includes("reject") && (
          <button type="button" className="btn danger-outline sm" onClick={() => open("reject")}>
            Request changes
          </button>
        )}
        {actions.includes("revoke") && (
          <button type="button" className="btn danger-outline sm" onClick={() => open("revoke")}>
            Revoke
          </button>
        )}
      </div>

      <dialog ref={dialog} className="modal" aria-labelledby={`dlg-${teacherId}`}>
        <div className="modal-body">
          <div>
            <h2 id={`dlg-${teacherId}`}>{c.title}</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              <strong style={{ color: "var(--ink)" }}>{name}</strong>. {c.body}
            </p>
          </div>
          {action !== "approve" && (
            <>
              <div className="chips wrap" role="group" aria-label="Common reasons">
                {PRESETS.map((p) => (
                  <button key={p} type="button" className="chip" aria-pressed={reason === p} onClick={() => setReason(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Reason shown to the teacher</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} style={{ minHeight: 96 }} aria-invalid={!!error} />
              </label>
            </>
          )}
          {error && <div className="field-error" role="alert"><Icon name="alert" /> {error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={() => dialog.current?.close()} disabled={loading}>
              Cancel
            </button>
            <button type="button" className={c.tone} onClick={confirm} disabled={loading}>
              {loading ? <><Icon name="loader" className="spin" /> Saving…</> : c.cta}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
