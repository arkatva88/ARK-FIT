"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getQueryClient } from "@/lib/query-client";
import { unsubscribeUserFromPush } from "@/lib/notifications/client";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Target,
  UserCheck,
  Dumbbell,
  BarChart3,
  Settings,
  MoreHorizontal,
  X,
  LogOut,
  Building2,
  Loader2,
} from "lucide-react";

interface OwnerMobileNavProps {
  gymName?: string;
}

export function OwnerMobileNav({ gymName = "ARK FIT" }: OwnerMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await unsubscribeUserFromPush().catch(() => {});
      const queryClient = getQueryClient();
      queryClient.clear();
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  const primaryItems = [
    { label: "Dashboard", href: "/owner", icon: LayoutDashboard, exact: true },
    { label: "Members", href: "/owner/members", icon: Users },
    { label: "Attendance", href: "/owner/attendance", icon: CalendarCheck },
    { label: "Payments", href: "/owner/payments", icon: CreditCard },
  ];

  const moreItems = [
    { label: "PT Management", href: "/owner/pt", icon: Target, desc: "Package quotas & coach assignments" },
    { label: "Trainers", href: "/owner/trainers", icon: UserCheck, desc: "Coach roster & specializations" },
    { label: "Workouts", href: "/owner/workouts", icon: Dumbbell, desc: "Exercise reference library" },
    { label: "Reports", href: "/owner/reports", icon: BarChart3, desc: "Revenue & attendance trends" },
    { label: "Settings", href: "/owner/settings", icon: Settings, desc: "Gym rules & account configuration" },
  ];

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Persistent Bottom Bar (Mobile only) - Safe Area Compliant */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white border-t border-slate-200 z-40 px-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive
                  ? "text-[#1E40AF] font-bold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#1E40AF] rounded-full" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
            </Link>
          );
        })}

        {/* More Drawer Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isMoreActive || drawerOpen
              ? "text-[#1E40AF] font-bold"
              : "text-slate-500 hover:text-slate-900 font-medium"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer for Additional Navigation */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 flex flex-col justify-end">
          <div
            className="w-full bg-white rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl border-t border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#1E40AF] text-white font-bold text-xs flex items-center justify-center">
                  A
                </div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {gymName} • Management
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links List */}
            <div className="p-3 overflow-y-auto space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-blue-50 text-[#1E40AF] font-semibold border border-blue-100"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-[#1E40AF] text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions with Safe-Area Padding */}
            <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-slate-200 bg-slate-50/50">
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
              >
                {signingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
