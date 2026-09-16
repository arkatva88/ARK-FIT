"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, must_change_password")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Unable to fetch user profile. Please contact the gym owner.");
        }

        if (profile.must_change_password) {
          router.push("/change-password");
          return;
        }

        if (profile.role === "OWNER") router.push("/owner");
        else if (profile.role === "TRAINER") router.push("/trainer");
        else router.push("/member");
      }
    } catch (err: any) {
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8FAFC]">
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

        {/* Card */}
        <div className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Sign In to Portal
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Enter your authorized staff or athlete account credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@arkfit.com"
                  className="w-full pl-9 pr-3 h-10 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 h-10 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Role Quick Login Buttons for Evaluation */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Quick Demo Roles
              </span>
              <span className="text-[10px] text-[#94A3B8]">Click to populate</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("owner@arkfit.com", "Owner@123")}
                className="px-2.5 py-1.5 rounded border border-[#E2E8F0] hover:border-[#1E40AF] hover:bg-[#F8FAFC] text-left text-xs transition-colors"
              >
                <span className="font-semibold text-[#0F172A] block">Gym Owner</span>
                <span className="text-[10px] text-[#64748B] block truncate">owner@arkfit.com</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("trainer@arkfit.com", "Trainer@123")}
                className="px-2.5 py-1.5 rounded border border-[#E2E8F0] hover:border-[#1E40AF] hover:bg-[#F8FAFC] text-left text-xs transition-colors"
              >
                <span className="font-semibold text-[#0F172A] block">Head Coach</span>
                <span className="text-[10px] text-[#64748B] block truncate">trainer@arkfit.com</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("pt@arkfit.com", "Member@123")}
                className="px-2.5 py-1.5 rounded border border-[#E2E8F0] hover:border-[#1E40AF] hover:bg-[#F8FAFC] text-left text-xs transition-colors"
              >
                <span className="font-semibold text-[#0F172A] block">PT Member</span>
                <span className="text-[10px] text-[#64748B] block truncate">pt@arkfit.com</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials("normal@arkfit.com", "Member@123")}
                className="px-2.5 py-1.5 rounded border border-[#E2E8F0] hover:border-[#1E40AF] hover:bg-[#F8FAFC] text-left text-xs transition-colors"
              >
                <span className="font-semibold text-[#0F172A] block">Normal Member</span>
                <span className="text-[10px] text-[#64748B] block truncate">normal@arkfit.com</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-[11px] text-[#94A3B8]">
            ARK FIT Gym Operating System · Financial & Floor Management
          </p>
        </div>
      </div>
    </div>
  );
}
