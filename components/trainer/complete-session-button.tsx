"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission lock
  const isSubmittingRef = useRef(false);

  const handleComplete = async () => {
    if (isSubmittingRef.current || loading) return;

    const notes = window.prompt("Add session notes or observations (optional):", "Completed with good form and high energy.");
    if (notes === null) return;

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcErr } = await supabase.rpc("complete_pt_session", {
        p_session_id: sessionId,
        p_trainer_notes: notes,
      });

      if (rpcErr) throw rpcErr;
      if (!data?.success) {
        throw new Error(data?.error || "Failed to complete session");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to complete session");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleComplete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-emerald-700" />
            <span>Completing...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Complete Session</span>
          </>
        )}
      </button>
      {error && (
        <span className="text-[10px] text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </span>
      )}
    </div>
  );
}
