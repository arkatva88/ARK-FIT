"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, ShieldAlert, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Update Supabase Auth password & metadata simultaneously
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });

      if (updateError) throw new Error(updateError.message);

      // 2. Clear must_change_password flag in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User session not found.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id)
        .select("role")
        .single();

      if (profileError) throw new Error(profileError.message);

      // 3. Fast-path redirect to role dashboard
      const role = profile?.role || user.user_metadata?.role;
      if (role === "OWNER") router.push("/owner");
      else if (role === "TRAINER") router.push("/trainer");
      else router.push("/member");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xl shadow-sm">
            A
          </div>
          <div className="text-left">
            <span className="text-xl font-bold tracking-tight text-[#0F172A] block leading-none">
              ARK FIT
            </span>
            <span className="text-xs text-[#64748B] font-medium block mt-0.5">
              Gym Management Platform
            </span>
          </div>
        </div>

        <div className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-200">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Create Your New Password
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-xs">
              For your account security, please replace the temporary password assigned by your Gym Owner before continuing.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C] text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-10 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-10 px-3.5 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
              />
            </div>

            <div className="text-xs text-[#64748B] space-y-1.5 py-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${password.length >= 6 ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Minimum 6 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${password && password === confirmPassword ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                </>
              ) : (
                <>
                  Set Password & Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
