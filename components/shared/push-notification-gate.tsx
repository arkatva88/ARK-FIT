"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Loader2,
  X,
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
  const [isDismissed, setIsDismissed] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "denied" | "unsupported" | "granted">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if dismissed in sessionStorage for this browser session
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("arkfit_push_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    }

    if (!isPushNotificationSupported()) {
      setStatus("unsupported");
      return;
    }

    const permission = getNotificationPermission();

    if (permission === "granted") {
      setStatus("granted");
      // Ensure current device is registered in DB in background
      isDevicePushSubscribed().then((isSubscribed) => {
        if (!isSubscribed) {
          subscribeUserToPush().catch(() => {});
        }
      });
    } else if (permission === "denied") {
      setStatus("denied");
    } else {
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

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("arkfit_push_dismissed", "true");
    }
  };

  if (!mounted) return null;

  // 1. OWNER: Dashboard-first! Never block or distract the gym owner with push prompts.
  if (role === "OWNER") {
    return null;
  }

  // 2. If already granted, unsupported, or dismissed by user, do not show banner
  if (status === "granted" || status === "unsupported" || isDismissed) {
    if (successToast) {
      return (
        <div className="fixed bottom-4 right-4 z-50 p-3.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Push notifications enabled successfully!</span>
        </div>
      );
    }
    return null;
  }

  // 3. TRAINER and MEMBER: Friendly, non-blocking notification banner
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 sm:px-6 relative transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-xs text-blue-900">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-[#1E40AF]">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <p>
            <strong className="font-semibold text-slate-900">
              {userName ? `Hi ${userName}` : "Stay updated"}:
            </strong>{" "}
            {role === "TRAINER"
              ? "Enable notifications to receive instant athlete check-in & PT appointment alerts."
              : "Enable notifications to receive workout updates, PT reminders, and renewal receipts."}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {status !== "denied" && (
            <button
              onClick={handleRequestPermission}
              disabled={status === "requesting"}
              className="h-7 px-3 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {status === "requesting" ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-blue-200" />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-blue-100/60 transition-colors"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="max-w-7xl mx-auto mt-1 text-[11px] text-rose-600">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
