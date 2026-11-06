"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewButtons({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    let reason: string | undefined;
    if (action === "reject") {
      const r = window.prompt("Why is this profile being rejected? The teacher will see this.");
      if (r === null) return;
      reason = r;
    }
    setLoading(true);
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, action, reason }),
    });
    setLoading(false);
    if (!res.ok) return alert((await res.json()).error ?? "Failed");
    router.refresh();
  }

  return (
    <div className="row">
      <button className="btn" disabled={loading} onClick={() => act("approve")}>
        Approve
      </button>
      <button className="btn danger" disabled={loading} onClick={() => act("reject")}>
        Reject
      </button>
    </div>
  );
}
