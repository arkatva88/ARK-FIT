"use client";

import { useState, useEffect } from "react";
import {
  X,
  Bell,
  Check,
  Loader2,
  Moon,
  Send,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { NotificationPreferences } from "@/lib/notifications/types";
import {
  isPushNotificationSupported,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "@/lib/notifications/client";

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [pushSupported, setPushSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [pushSubscribing, setPushSubscribing] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    id: "",
    user_id: "",
    gym_id: "",
    payment_reminders: true,
    payment_confirmations: true,
    membership_expiry: true,
    pt_reminders: true,
    attendance_reminders: true,
    workout_reminders: true,
    system_security: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    timezone: "Asia/Kolkata",
    created_at: "",
    updated_at: "",
  });

  // Load preferences and browser push permission
  useEffect(() => {
    if (!isOpen) return;

    const supported = isPushNotificationSupported();
    setPushSupported(supported);

    if (supported && typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState("unsupported");
    }

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications/preferences");
        const data = await res.json();
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      onClose();
    } catch (err: any) {
      alert("Error saving preferences: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePushOptIn = async () => {
    setPushSubscribing(true);
    try {
      const result = await subscribeUserToPush();
      if (result.success) {
        setPermissionState("granted");
      } else {
        alert(result.error || "Could not enable push notifications.");
        if (typeof window !== "undefined" && "Notification" in window) {
          setPermissionState(Notification.permission);
        }
      }
    } catch (err: any) {
      alert("Push activation failed: " + err.message);
    } finally {
      setPushSubscribing(false);
    }
  };

  const handlePushDisable = async () => {
    setPushSubscribing(true);
    try {
      await unsubscribeUserFromPush();
      setTestFeedback({
        success: true,
        message: "This browser device was unregistered from Web Push.",
      });
    } catch (err: any) {
      alert("Failed to unregister: " + err.message);
    } finally {
      setPushSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    setTesting(true);
    setTestFeedback(null);
    try {
      const res = await fetch("/api/notifications/send-test", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setTestFeedback({
          success: true,
          message: data.message || "Test push dispatched successfully!",
        });
      } else {
        setTestFeedback({
          success: false,
          message: data.error || "Failed to dispatch test push.",
        });
      }
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: "Network error sending test push: " + err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E40AF] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notification Preferences</h2>
              <p className="text-[11px] text-slate-500">Configure Web Push alerts and reminder channels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1E40AF]" />
              <span>Loading notification settings...</span>
            </div>
          ) : (
            <>
              {/* Device Web Push Status Card */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#1E40AF]" />
                    Browser Web Push Status
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      permissionState === "granted"
                        ? "bg-emerald-100 text-emerald-800"
                        : permissionState === "denied"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {permissionState === "granted"
                      ? "Active & Subscribed"
                      : permissionState === "denied"
                      ? "Blocked in Browser"
                      : "Permission Needed"}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {permissionState === "granted"
                    ? "This device is registered to receive instant transactional notifications even when ARK FIT is closed."
                    : permissionState === "denied"
                    ? "Push notifications are blocked in your browser site settings. Click the lock/info icon in the address bar to allow notifications."
                    : "Allow push notifications to receive real-time alerts for payment dues, membership expiry, and session schedules."}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {permissionState !== "granted" && pushSupported && (
                    <button
                      onClick={handlePushOptIn}
                      disabled={pushSubscribing || permissionState === "denied"}
                      className="h-7 px-3 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {pushSubscribing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Enable Web Push on this Device</span>
                    </button>
                  )}

                  {permissionState === "granted" && (
                    <button
                      onClick={handlePushDisable}
                      disabled={pushSubscribing}
                      className="h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-medium transition-colors"
                    >
                      Unsubscribe Device
                    </button>
                  )}

                  <button
                    onClick={handleSendTestPush}
                    disabled={testing}
                    className="h-7 px-3 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm ml-auto disabled:opacity-50"
                  >
                    {testing ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#1E40AF]" />
                    ) : (
                      <Send className="w-3 h-3 text-[#1E40AF]" />
                    )}
                    <span>Send Test Push</span>
                  </button>
                </div>

                {testFeedback && (
                  <div
                    className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                      testFeedback.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {testFeedback.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>{testFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Granular Notification Channels */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
                  Notification Categories
                </span>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden">
                  {[
                    {
                      key: "payment_reminders" as const,
                      label: "Payment Due Reminders",
                      desc: "Notices before and on fee due dates",
                    },
                    {
                      key: "payment_confirmations" as const,
                      label: "Payment Confirmations",
                      desc: "Instant receipts for Razorpay and UPI transactions",
                    },
                    {
                      key: "membership_expiry" as const,
                      label: "Membership Expiry Alerts",
                      desc: "Advance notices when your membership validity is ending",
                    },
                    {
                      key: "pt_reminders" as const,
                      label: "PT Session Reminders",
                      desc: "Upcoming personal training session schedule alerts",
                    },
                    {
                      key: "attendance_reminders" as const,
                      label: "Attendance & Streak Alerts",
                      desc: "Check-in confirmations and attendance milestones",
                    },
                    {
                      key: "workout_reminders" as const,
                      label: "Workout Reminders",
                      desc: "Daily workout and exercise routine schedules",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <div className="pr-4">
                        <span className="font-bold text-slate-800 block text-xs">{item.label}</span>
                        <span className="text-[11px] text-slate-500 block">{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(prefs[item.key])}
                        onChange={() => handleToggle(item.key)}
                        className="w-4 h-4 text-[#1E40AF] rounded border-slate-300 focus:ring-[#1E40AF] cursor-pointer"
                      />
                    </label>
                  ))}

                  {/* Security (Always On) */}
                  <div className="flex items-center justify-between p-3 bg-slate-50/40">
                    <div className="pr-4">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        Account Security & System Alerts
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Password resets, role updates, and critical security notices (Required)
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      ON
                    </span>
                  </div>
                </div>
              </div>

              {/* Quiet Hours & Timezone */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="font-bold text-slate-900 block">Quiet Hours</span>
                      <span className="text-[11px] text-slate-500 block">
                        Do not dispatch non-critical push notifications during sleep hours
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.quiet_hours_enabled}
                    onChange={() => handleToggle("quiet_hours_enabled")}
                    className="w-4 h-4 text-[#1E40AF] rounded border-slate-300 focus:ring-[#1E40AF] cursor-pointer"
                  />
                </div>

                {prefs.quiet_hours_enabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                        Quiet Hours Start
                      </label>
                      <input
                        type="time"
                        value={prefs.quiet_hours_start}
                        onChange={(e) =>
                          setPrefs((prev) => ({ ...prev, quiet_hours_start: e.target.value }))
                        }
                        className="w-full h-8 px-2.5 rounded border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 uppercase font-semibold text-[10px] mb-1">
                        Quiet Hours End
                      </label>
                      <input
                        type="time"
                        value={prefs.quiet_hours_end}
                        onChange={(e) =>
                          setPrefs((prev) => ({ ...prev, quiet_hours_end: e.target.value }))
                        }
                        className="w-full h-8 px-2.5 rounded border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="h-8 px-4 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
