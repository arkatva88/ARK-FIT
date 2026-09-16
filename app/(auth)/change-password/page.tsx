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
      // 1. Update Supabase Auth password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
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

      // 3. Redirect to role dashboard
      if (profile.role === "OWNER") router.push("/owner");
      else if (profile.role === "TRAINER") router.push("/trainer");
      else router.push("/member");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-black">
      <div className="w-full max-w-md">
        <div className="p-8 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create Your New Password
            </h1>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs">
              For your account security, you must replace the temporary password assigned by your Gym Owner before continuing.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-background/80 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 rounded-xl bg-background/80 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1 py-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${password.length >= 6 ? "text-primary" : "text-muted"}`} />
                <span>Minimum 6 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${password && password === confirmPassword ? "text-primary" : "text-muted"}`} />
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
