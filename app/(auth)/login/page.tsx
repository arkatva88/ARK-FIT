"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, Loader2, AlertCircle, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission ref to guarantee single-request execution even on rapid multi-clicks/touches
  const isSubmittingRef = useRef(false);

  const setDemoCredentials = (roleEmail: string, rolePass: string) => {
    if (loading || redirecting) return;
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard at form submission level
    if (isSubmittingRef.current || loading || redirecting) return;
    isSubmittingRef.current = true;

    // Transition IMMEDIATELY on the client - zero dead period
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        // Transition button to redirecting state
        setRedirecting(true);

        // Fast-Path: Zero-roundtrip role resolution from user_metadata
        const role = data.user.user_metadata?.role;
        const mustChange = data.user.user_metadata?.must_change_password;

        let targetUrl = "/member";
        if (mustChange) {
          targetUrl = "/change-password";
        } else if (role === "OWNER") {
          targetUrl = "/owner";
        } else if (role === "TRAINER") {
          targetUrl = "/trainer";
        } else if (role === "MEMBER") {
          targetUrl = "/member";
        } else {
          // Resilient Fallback: Only queries profiles if user_metadata is missing
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, must_change_password")
            .eq("id", data.user.id)
            .maybeSingle();

          if (profile?.must_change_password) {
            targetUrl = "/change-password";
          } else if (profile?.role === "OWNER") {
            targetUrl = "/owner";
          } else if (profile?.role === "TRAINER") {
            targetUrl = "/trainer";
          } else {
            targetUrl = "/member";
          }
        }

        // Direct top-level navigation ensures the freshly set session cookies
        // are immediately transmitted in HTTP headers to Next.js middleware and Server Components,
        // eliminating client router cache redirect loops and infinite loading states completely.
        window.location.replace(targetUrl);
        return;
      }
    } catch (err: any) {
      // Re-enable submission on error
      isSubmittingRef.current = false;
      setLoading(false);
      setRedirecting(false);

      // Strict user-friendly error sanitization - never leak database errors or internal details
      const msg = (err?.message || "").toLowerCase();
      if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid credential") ||
        msg.includes("invalid_grant") ||
        msg.includes("user not found")
      ) {
        setError("Email or password is incorrect.");
      } else if (
        msg.includes("rate") ||
        msg.includes("too many requests") ||
        msg.includes("over_email_send_rate_limit")
      ) {
        setError("Too many attempts. Please wait and try again.");
      } else if (
        msg.includes("fetch") ||
        msg.includes("network") ||
        (typeof navigator !== "undefined" && !navigator.onLine)
      ) {
        setError("Unable to connect. Please check your internet connection and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  const isFormBusy = loading || redirecting;

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
            <div className="mb-5 p-3 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C] text-xs flex items-start gap-2 animate-in fade-in">
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
                  disabled={isFormBusy}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. owner@arkfit.com"
                  className="w-full pl-9 pr-3 h-10 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  disabled={isFormBusy}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 h-10 rounded border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isFormBusy}
              className="w-full h-10 rounded bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Redirecting to dashboard...</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
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
