"use client";

import { Send, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface PaymentRemindButtonProps {
  memberName: string;
  memberId?: string;
  paymentId?: string;
}

export function PaymentRemindButton({
  memberName,
  memberId,
  paymentId,
}: PaymentRemindButtonProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClick = async () => {
    if (!memberId) {
      alert(`Reminder queued for ${memberName}.`);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/notifications/remind-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, paymentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reminder");
      }

      setSent(true);
      setFeedback(data.isDuplicate ? "Already reminded today" : "Push reminder sent");
      setTimeout(() => {
        setSent(false);
        setFeedback(null);
      }, 4000);
    } catch (err: any) {
      alert(`Failed to send reminder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={sent || loading}
      title={feedback || "Send Web Push & In-app payment reminder"}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-[#1E40AF]" />
          <span>Sending...</span>
        </>
      ) : sent ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" />
          <span className="text-emerald-700 font-semibold">{feedback || "Reminded"}</span>
        </>
      ) : (
        <>
          <Send className="w-3 h-3 text-slate-400" />
          <span>Remind</span>
        </>
      )}
    </button>
  );
}
