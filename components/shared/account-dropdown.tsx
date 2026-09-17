"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getQueryClient } from "@/lib/query-client";
import { unsubscribeUserFromPush } from "@/lib/notifications/client";
import {
  User,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  Loader2,
  Dumbbell,
  FileText,
  BarChart3,
  QrCode,
  CreditCard,
  Building2,
} from "lucide-react";

interface AccountDropdownProps {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    full_name: string;
    role: "OWNER" | "TRAINER" | "MEMBER";
    member_type?: "NORMAL" | "PT";
  };
  gymName: string;
  branchName?: string;
  position?: "header" | "sidebar";
}

export function AccountDropdown({
  user,
  profile,
  gymName,
  branchName = "Main Branch",
  position = "header",
}: AccountDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = profile.full_name?.slice(0, 2).toUpperCase() || "AF";

  const roleLabel =
    profile.role === "OWNER"
      ? "Gym Owner"
      : profile.role === "TRAINER"
      ? "Floor Coach"
      : profile.member_type === "PT"
      ? "PT Athlete"
      : "General Member";

  const roleBadgeStyle =
    profile.role === "OWNER"
      ? "bg-blue-50 text-[#1E40AF] border-blue-200"
      : profile.role === "TRAINER"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : profile.member_type === "PT"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      // 1. Revoke browser push subscription for this session
      await unsubscribeUserFromPush().catch(() => {});

      // 2. Clear TanStack query cache to prevent stale authenticated data in client memory
      const queryClient = getQueryClient();
      queryClient.clear();

      // 2. Sign out client session
      const supabase = createClient();
      await supabase.auth.signOut();

      // 3. Trigger server cookie cleanup
      await fetch("/api/auth/signout", { method: "POST" });

      // 4. Redirect to login
      router.push("/login");
      router.refresh();
    } catch {
      // Fallback redirect
      window.location.href = "/login";
    }
  };

  const isSidebar = position === "sidebar";

  return (
    <div className={`relative ${isSidebar ? "w-full" : "inline-block"} text-left`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="User Account Menu"
        className={
          isSidebar
            ? "w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 group"
            : "flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20"
        }
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {initials}
          </div>
          <div className={`${isSidebar ? "flex" : "hidden sm:flex"} flex-col text-left leading-none min-w-0`}>
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
              {profile.full_name}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">{roleLabel}</span>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={
            isSidebar
              ? "absolute bottom-full mb-2 left-0 w-64 origin-bottom-left rounded-xl bg-white border border-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
              : "absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-[18rem] origin-top-right rounded-xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
          }
        >
          {/* Header Card */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                  {profile.full_name}
                </h3>
                {user.email && (
                  <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                    {user.email}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadgeStyle}`}
              >
                {roleLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-600 font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#1E40AF] shrink-0" />
              <span className="truncate">{gymName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 shrink-0">{branchName}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="p-1.5 flex flex-col gap-0.5 text-xs">
            {profile.role === "OWNER" && (
              <>
                <Link
                  href="/owner/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Gym Settings</span>
                </Link>
                <Link
                  href="/owner/reports"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
                >
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <span>Financial & Attendance Reports</span>
                </Link>
              </>
            )}

            {profile.role === "TRAINER" && (
              <>
                <Link
                  href="/trainer/workouts"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
                >
                  <Dumbbell className="w-4 h-4 text-slate-500" />
                  <span>Exercise Library</span>
                </Link>
                <Link
                  href="/trainer/notes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Floor Observation Notes</span>
                </Link>
              </>
            )}

            {profile.role === "MEMBER" && (
              <>
                <Link
                  href="/member/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
                >
                  <QrCode className="w-4 h-4 text-slate-500" />
                  <span>My Profile & Digital QR</span>
                </Link>
                <Link
                  href="/member/payments"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
                >
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>Billing & Membership Fees</span>
                </Link>
              </>
            )}

            <Link
              href="/change-password"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
            >
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Change Password</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="p-1.5 border-t border-slate-200 bg-slate-50/50">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
              ) : (
                <LogOut className="w-4 h-4 text-rose-700" />
              )}
              <span>{signingOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
