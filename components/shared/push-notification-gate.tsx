"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  subscribeUserToPush,
  isDevicePushSubscribed,
} from "@/lib/notifications/client";

interface PushNotificationGateProps {
  role?: "OWNER" | "TRAINER" | "MEMBER";
  userName?: string;
}

export function PushNotificationGate({ role, userName }: PushNotificationGateProps) {
  const [mounted, setMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "denied" | "unsupported" | "granted">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!isPushNotificationSupported()) {
      setStatus("unsupported");
      // Unsupported hardware/browser shouldn't permanently lock out user
      return;
    }

    const permission = getNotificationPermission();

    if (permission === "granted") {
      setIsBlocked(false);
      setStatus("granted");
      // Ensure current device is registered in DB in background
      isDevicePushSubscribed().then((isSubscribed) => {
        if (!isSubscribed) {
          subscribeUserToPush().catch(() => {});
        }
      });
    } else if (permission === "denied") {
      setIsBlocked(true);
      setStatus("denied");
    } else {
      // "default" / prompt required
      setIsBlocked(true);
      setStatus("idle");
    }
  }, []);

  const handleRequestPermission = async () => {
    setStatus("requesting");
    setErrorMessage(null);

    try {
      const res = await subscribeUserToPush();

      if (res.success) {
        setStatus("granted");
        setIsBlocked(false);
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 4000);
      } else {
        const perm = getNotificationPermission();
        if (perm === "denied") {
          setStatus("denied");
        } else {
          setStatus("idle");
        }
        setErrorMessage(res.error || "Permission was not granted.");
      }
    } catch (err: any) {
      const perm = getNotificationPermission();
      if (perm === "denied") {
        setStatus("denied");
      } else {
        setStatus("idle");
      }
      setErrorMessage(err.message || "Failed to enable notifications.");
    }
  };

  const handleVerifyPermission = async () => {
    const perm = getNotificationPermission();
    if (perm === "granted") {
      handleRequestPermission();
    } else if (perm === "denied") {
      setStatus("denied");
      setErrorMessage(
        "Notifications are still blocked in browser site settings. Please click the lock/settings icon in your URL bar, switch Notifications to 'Allow', then click verify."
      );
    } else {
      handleRequestPermission();
    }
  };

  // Do not render anything during SSR
  if (!mounted) return null;

  return (
    <>
      {/* Success Toast when granted */}
      {successToast && (
        <div className="fixed top-4 right-4 z-[10000] bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>Web Push Notifications active! You will receive gym updates.</span>
        </div>
      )}

      {/* Mandatory Blocking Gate Overlay */}
      {isBlocked && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden my-auto">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-[#1E40AF] to-indigo-600" />

            {/* Glowing Bell Badge */}
            <div className="relative w-16 h-16 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center mx-auto mb-5 border border-blue-200 shadow-sm ring-8 ring-blue-50/60">
              <Bell className="w-8 h-8 text-[#1E40AF]" />
              <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
              <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white" />
            </div>

            {/* Title & Personalized Greeting */}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Please Allow Notifications
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              {userName ? `Hi ${userName}, to` : "To"} access your ARK FIT account, you must allow
              browser push notifications. This ensures you never miss important gym updates.
            </p>

            {/* Benefit Highlights */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] shrink-0" />
                <span>
                  {role === "TRAINER"
                    ? "Athlete check-ins & PT booking alerts"
                    : role === "OWNER"
                    ? "Payment collections & floor live counts"
                    : "Assigned workout splits & diet updates"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] shrink-0" />
                <span>Immediate membership & fee expiry reminders</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] shrink-0" />
                <span>Emergency gym announcements and operational updates</span>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mt-3.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Interactive Flow */}
            {status === "denied" ? (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Notifications are currently blocked</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Your browser has notifications set to <strong>Block</strong> for this site. To continue:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 font-medium">
                    <li>Click the 🔒 lock or settings icon in your browser URL bar.</li>
                    <li>Change <strong>Notifications</strong> to <strong>Allow</strong>.</li>
                    <li>Click the verify button below.</li>
                  </ol>
                </div>

                <button
                  onClick={handleVerifyPermission}
                  className="w-full py-3 px-4 rounded-xl bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>I've Allowed It - Verify Again</span>
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRequestPermission}
                  disabled={status === "requesting"}
                  className="w-full py-3 px-4 rounded-xl bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {status === "requesting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Requesting Permission...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Allow Notifications to Continue</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400">
                  Clicking "Allow Notifications" will trigger your browser's native permission prompt.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
