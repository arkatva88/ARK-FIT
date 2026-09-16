"use client";

import { Send, Check } from "lucide-react";
import { useState } from "react";

interface PaymentRemindButtonProps {
  memberName: string;
}

export function PaymentRemindButton({ memberName }: PaymentRemindButtonProps) {
  const [sent, setSent] = useState(false);

  const handleClick = () => {
    setSent(true);
    alert(`Payment reminder queued for ${memberName}. (SMTP notifications will dispatch reminder emails/SMS upon configuration).`);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={sent}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
    >
      {sent ? (
        <>
          <Check className="w-3 h-3 text-emerald-600" /> Reminded
        </>
      ) : (
        <>
          <Send className="w-3 h-3 text-slate-400" /> Remind
        </>
      )}
    </button>
  );
}
