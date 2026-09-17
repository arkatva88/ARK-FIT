"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";

interface DeleteMemberButtonProps {
  memberId: string;
  memberName: string;
}

export function DeleteMemberButton({ memberId, memberName }: DeleteMemberButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous guard preventing multiple clicks from issuing duplicate delete mutations
  const isDeletingRef = useRef(false);

  const handleDelete = async () => {
    if (isDeletingRef.current || loading) return;
    isDeletingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Delete member (cascades to memberships, attendance, payments, notes)
      const { error: err } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (err) throw err;

      setIsOpen(false);
      router.push("/owner/members");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete member.");
      isDeletingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-9 px-3 rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete Member</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <button
              onClick={() => !loading && setIsOpen(false)}
              disabled={loading}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Athlete Account</h3>
                <span className="text-xs text-slate-500">Irreversible Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete athlete record for{" "}
              <strong className="text-slate-900">{memberName}</strong>? This will remove all linked
              attendance check-ins, payment logs, and PT packages.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="w-full sm:w-auto h-9 px-4 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Deleting Athlete...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Confirm Permanent Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
