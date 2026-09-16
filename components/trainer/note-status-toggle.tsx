"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function NoteStatusToggle({ noteId, currentStatus }: { noteId: string; currentStatus: "OPEN" | "RESOLVED" }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const nextStatus = currentStatus === "OPEN" ? "RESOLVED" : "OPEN";
    try {
      const { error } = await supabase
        .from("member_notes")
        .update({ status: nextStatus })
        .eq("id", noteId);

      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`h-7 px-2.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
        currentStatus === "OPEN"
          ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
          : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : currentStatus === "OPEN" ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Open Note
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
        </>
      )}
    </button>
  );
}
