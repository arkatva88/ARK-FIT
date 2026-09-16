"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    const notes = window.prompt("Add session notes or observations (optional):", "Completed with good form and high energy.");
    if (notes === null) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("complete_pt_session", {
        p_session_id: sessionId,
        p_trainer_notes: notes,
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || "Failed to complete session");
      }

      router.refresh();
    } catch (err: any) {
      alert("Error completing session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      )}
      <span>Complete Session</span>
    </button>
  );
}
