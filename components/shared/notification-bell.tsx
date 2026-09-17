"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Settings,
  CreditCard,
  Calendar,
  Dumbbell,
  Target,
  ShieldAlert,
  Loader2,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { InAppNotification, NotificationType } from "@/lib/notifications/types";
import { formatTimeAgo } from "@/lib/utils";
import {
  isPushNotificationSupported,
  subscribeUserToPush,
} from "@/lib/notifications/client";
import { NotificationPreferencesModal } from "./notification-preferences-modal";

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Push Permission State
  const [pushSupported, setPushSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [subscribingPush, setSubscribingPush] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load in-app notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/in-app?limit=15");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch in-app notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for background updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Check browser push permission
  useEffect(() => {
    const supported = isPushNotificationSupported();
    setPushSupported(supported);
    if (supported && typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState("unsupported");
    }
  }, [isOpen]);

  // Close on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/in-app", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleItemClick = async (notif: InAppNotification) => {
    if (!notif.read_at) {
      fetch("/api/notifications/in-app", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      }).catch(console.error);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsOpen(false);
    if (notif.url) {
      router.push(notif.url);
    }
  };

  const handleEnablePush = async () => {
    setSubscribingPush(true);
    try {
      const res = await subscribeUserToPush();
      if (res.success) {
        setPermissionState("granted");
      } else {
        alert(res.error || "Could not enable push notifications.");
        if (typeof window !== "undefined" && "Notification" in window) {
          setPermissionState(Notification.permission);
        }
      }
    } catch (err: any) {
      alert("Push subscription error: " + err.message);
    } finally {
      setSubscribingPush(false);
    }
  };

  const getCategoryIcon = (type: NotificationType) => {
    switch (type) {
      case "PAYMENT_REMINDER":
      case "PAYMENT_RECEIVED":
      case "PAYMENT_FAILED":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case "MEMBERSHIP_EXPIRING":
      case "MEMBERSHIP_EXPIRED":
        return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case "PT_SESSION_REMINDER":
      case "PT_SESSION_CANCELLED":
        return <Target className="w-3.5 h-3.5 text-blue-600" />;
      case "WORKOUT_REMINDER":
        return <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />;
      case "ACCOUNT_SECURITY":
      case "SYSTEM_NOTIFICATION":
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-[#1E40AF]" />;
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="relative p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#1E40AF] text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-75">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-[#1E40AF]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-[11px] font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsPreferencesOpen(true);
                }}
                title="Notification Settings"
                className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Permission Prompt Banner (User Initiated) */}
          {permissionState === "default" && pushSupported && (
            <div className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-b border-blue-100/80 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#1E40AF] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-3 h-3" />
              </div>
              <div className="flex-1 text-[11px]">
                <strong className="text-slate-900 block font-semibold">Enable Push Reminders</strong>
                <p className="text-slate-600 mt-0.5 leading-snug">
                  Get instant payment and membership expiry alerts on your device.
                </p>
                <button
                  onClick={handleEnablePush}
                  disabled={subscribingPush}
                  className="mt-2 h-6 px-2.5 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-[10px] flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                >
                  {subscribingPush ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Check className="w-2.5 h-2.5" />
                  )}
                  <span>Enable Push</span>
                </button>
              </div>
            </div>
          )}

          {permissionState === "denied" && (
            <div className="px-3 py-2 bg-amber-50/70 border-b border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Push blocked in browser. Allow in site settings to receive device alerts.</span>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const isUnread = !notif.read_at;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                      isUnread ? "bg-blue-50/30" : "bg-white"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate block ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {notif.body}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#1E40AF] shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-10 px-4 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                <Bell className="w-6 h-6 text-slate-300" />
                <span className="font-medium">No notifications yet</span>
                <span className="text-[10px] text-slate-400">
                  You are all caught up on membership and gym updates.
                </span>
              </div>
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsPreferencesOpen(true);
              }}
              className="text-[11px] text-[#1E40AF] hover:underline font-semibold"
            >
              Manage Notification Channels & Quiet Hours
            </button>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
}
