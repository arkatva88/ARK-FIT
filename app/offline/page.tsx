"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<boolean | null>(null);

  useEffect(() => {
    setOnlineStatus(navigator.onLine);

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsRetrying(false);
      }
    }, 600);
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
              Progressive Gym Operating System
            </span>
          </div>
        </div>

        {/* Offline Card */}
        <div className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <WifiOff className="w-7 h-7 text-[#1E40AF]" />
          </div>

          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            You&apos;re Offline
          </h1>

          <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
            Previously cached screens may still be accessible, but new data synchronization and payment actions require an active internet connection.
          </p>

          <div className="mt-5 p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${onlineStatus ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span>
              {onlineStatus ? "Connection restored! Ready to reconnect." : "Waiting for network connectivity..."}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full h-10 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Testing Network..." : "Try Again"}
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full h-9 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Go Back to Cached View
            </button>
          </div>
        </div>

        <div className="text-center mt-5">
          <p className="text-[11px] text-slate-400">
            ARK FIT Offline Resilience Engine · Local Safety Guaranteed
          </p>
        </div>
      </div>
    </div>
  );
}
