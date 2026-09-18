"use client";

import { Send, Check, Loader2, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "info" | "error">("success");
  const isSubmittingRef = useRef(false);

  const handleClick = async () => {
    if (isSubmittingRef.current || loading) return;

    if (!memberId) {
      setFeedback("Member ID missing");
      setFeedbackType("error");
      return;
    }

    isSubmittingRef.current = true;
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

      if (data.code === "ALREADY_PAID") {
        setFeedback("Payment is already completed");
        setFeedbackType("info");
      } else if (data.code === "NO_DUES") {
        setFeedback("No dues pending");
        setFeedbackType("info");
      } else if (data.isDuplicate) {
        setFeedback("Reminder already sent recently");
        setFeedbackType("info");
      } else {
        setFeedback("Reminder sent");
        setFeedbackType("success");
      }

      setTimeout(() => {
        setFeedback(null);
        isSubmittingRef.current = false;
      }, 3500);
    } catch (err: any) {
      setFeedback(err.message || "Failed to send");
      setFeedbackType("error");
      setTimeout(() => {
        setFeedback(null);
        isSubmittingRef.current = false;
      }, 3500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || !!feedback}
      title={feedback || `Send payment reminder to ${memberName}`}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded border text-xs font-medium transition-colors disabled:cursor-not-allowed ${
        feedback
          ? feedbackType === "success"
            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
            : feedbackType === "info"
            ? "bg-amber-50 border-amber-300 text-amber-700"
            : "bg-rose-50 border-rose-300 text-rose-700"
          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60"
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-[#1E40AF]" />
          <span>Sending...</span>
        </>
      ) : feedback ? (
        <>
          {feedbackType === "success" ? (
            <Check className="w-3 h-3 text-emerald-600" />
          ) : (
            <AlertCircle className="w-3 h-3 text-amber-600" />
          )}
          <span className="font-semibold">{feedback}</span>
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
