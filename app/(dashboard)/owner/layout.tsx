import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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
  LogOut,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, gyms(name)")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "OWNER") {
    redirect(profile?.role === "TRAINER" ? "/trainer" : "/member");
  }

  const gymName = (profile as any)?.gyms?.name || "ARK FIT";
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() || "OW";

  const navItems = [
    { label: "Dashboard", href: "/owner", icon: LayoutDashboard },
    { label: "Members", href: "/owner/members", icon: Users },
    { label: "Attendance", href: "/owner/attendance", icon: CalendarCheck },
    { label: "Payments", href: "/owner/payments", icon: CreditCard },
    { label: "PT", href: "/owner/pt", icon: Target },
    { label: "Trainers", href: "/owner/trainers", icon: UserCheck },
    { label: "Workouts", href: "/owner/workouts", icon: Dumbbell },
    { label: "Reports", href: "/owner/reports", icon: BarChart3 },
    { label: "Settings", href: "/owner/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Persistent Left Navigation Rail (240px Fixed) */}
      <aside className="hidden lg:flex flex-col justify-between h-screen w-60 p-4 fixed left-0 top-0 z-40 bg-white border-r border-[#E2E8F0]">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="px-1 pt-1 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#1E40AF] leading-none">
                ARK FIT
              </span>
              <span className="text-[11px] text-[#64748B] font-medium mt-0.5">
                Koramangala Branch
              </span>
            </div>
          </div>

          {/* Quick Check-in CTA Button */}
          <Link
            href="/owner/attendance"
            className="w-full h-9 bg-[#1E40AF] text-white rounded text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1D4ED8] transition-colors shadow-sm"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Quick Check-in</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded text-xs font-medium text-[#444653] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#64748B] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Support & Sign Out */}
        <div className="flex flex-col gap-1 pt-3 border-t border-[#E2E8F0]">
          <div className="px-3 py-1 text-[11px] text-[#64748B] flex items-center justify-between">
            <span className="font-semibold text-[#0F172A] truncate">{profile.full_name}</span>
            <span className="text-[10px] bg-blue-50 text-[#1E40AF] px-1.5 py-0.5 rounded font-bold">Owner</span>
          </div>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-xs text-[#BE123C] hover:bg-[#FFF1F2] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-60 flex flex-col flex-1 min-w-0">
        {/* Top Header Sticky Bar */}
        <header className="flex justify-between items-center w-full px-4 lg:px-8 h-14 sticky top-0 z-30 bg-white border-b border-[#E2E8F0]">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xs">
                A
              </div>
              <span className="text-sm font-bold text-[#1E40AF]">ARK FIT</span>
            </div>

            {/* Live Search */}
            <div className="relative w-full hidden sm:block">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search phone, member ID, or name..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
              />
            </div>
          </div>

          {/* Actions & Context */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#1E40AF] text-[11px] font-semibold border border-[#E2E8F0]">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
              Floor Live: 42
            </div>

            <Link
              href="/owner/payments"
              className="h-8 px-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              <span className="text-[#1E40AF] font-bold">₹</span>
              <span>New Collection</span>
            </Link>

            <Link
              href="/owner/attendance"
              className="hidden sm:flex h-8 px-2.5 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white rounded text-xs font-semibold items-center gap-1.5 transition-colors shadow-sm"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Quick Check-in</span>
            </Link>

            <div className="h-4 w-px bg-[#E2E8F0]" />

            <div className="w-8 h-8 rounded-full bg-[#DBEAFE] border border-[#CBD5E1] flex items-center justify-center font-bold text-xs text-[#1E40AF]">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
