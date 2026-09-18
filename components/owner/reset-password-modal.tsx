"use client";

import { useState, useRef } from "react";
import { KeyRound, X, Loader2, AlertCircle, CheckCircle2, Copy, ShieldAlert, ExternalLink } from "lucide-react";

interface ResetPasswordModalProps {
  memberId: string;
  memberName: string;
}

export function ResetPasswordModal({ memberId, memberName }: ResetPasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    temporaryPassword: string;
    recoveryLink: string | null;
    athleteEmail: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isSubmittingRef = useRef(false);

  const handleOpen = () => {
    setError(null);
    setResult(null);
    setCopiedPass(false);
    setCopiedLink(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleReset = async () => {
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/owner/members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to initiate password reset");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to initiate reset");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "pass" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "pass") {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
        <span>Reset Password</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Emergency Password Reset</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!result ? (
                <>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <span className="font-bold block mb-0.5">Administrative Recovery Action</span>
                      <span>
                        This will reset the login password for <strong>{memberName}</strong>. The athlete will be required to set a new private password upon their next sign-in.
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Existing workout splits, payment history, attendance records, and personal training package sessions will remain completely intact.
                  </p>

                  {error && (
                    <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleClose}
                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleReset}
                      className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <span>Generate Temporary Credentials</span>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Success State with Temporary Password */
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold">Temporary Credentials Generated</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Share the following temporary password with <strong>{memberName}</strong> ({result.athleteEmail}):
                  </p>

                  {/* Temporary Password Box */}
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        One-Time Temporary Password
                      </span>
                      <span className="text-base font-mono font-bold text-[#1E40AF]">
                        {result.temporaryPassword}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.temporaryPassword, "pass")}
                      className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      {copiedPass ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {result.recoveryLink && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Direct Password Reset Link
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={result.recoveryLink}
                          className="w-full h-8 px-2.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-600 font-mono select-all truncate"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.recoveryLink!, "link")}
                          className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium shrink-0 flex items-center gap-1"
                        >
                          {copiedLink ? "Copied!" : "Copy Link"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                    <span className="font-bold block">Next Steps for Athlete:</span>
                    <span>1. Sign in with their email and the temporary password above.</span>
                    <span className="block">2. The portal will immediately enforce creating a private permanent password.</span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="h-8 px-4 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
