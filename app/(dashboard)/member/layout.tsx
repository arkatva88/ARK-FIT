import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Dumbbell,
  Target,
  TrendingUp,
  User,
  LogOut,
  CreditCard,
  QrCode,
  Salad,
  Bell,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function MemberLayout({
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

  if (profile?.role !== "MEMBER") {
    redirect(profile?.role === "OWNER" ? "/owner" : "/trainer");
  }

  // Fetch member capability layer (PT vs Normal)
  const { data: member } = await supabase
    .from("members")
    .select("id, member_type, status, membership_expiry")
    .eq("profile_id", user.id)
    .single();

  const isPtMember = member?.member_type === "PT";
  const gymName = (profile as any)?.gyms?.name || "ARK FIT";
  const initials = profile?.full_name?.slice(0, 2).toUpperCase() || "MB";

  const navItems = [
    { label: "Home", href: "/member", icon: Home },
    { label: "Workout", href: "/member/workout", icon: Dumbbell },
    ...(isPtMember ? [{ label: "PT Sessions", href: "/member/pt", icon: Target, isPt: true }] : []),
    { label: "Progress", href: "/member/progress", icon: TrendingUp },
    { label: "Profile", href: "/member/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Desktop Sidebar (Persistent 240px Rail) */}
      <aside className="hidden lg:flex flex-col justify-between h-screen w-60 p-3 fixed left-0 top-0 z-40 bg-white border-r border-slate-200">
        <div className="flex flex-col gap-5">
          {/* Header / Brand */}
          <div className="px-2 pt-2 flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1E40AF] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              A
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#1E40AF] leading-none">ARK FIT</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{gymName}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded text-slate-600 font-medium text-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                  {item.isPt && (
                    <span className="ml-auto px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      PT
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="pt-3 border-t border-slate-200">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-slate-500 font-medium text-xs hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div className="lg:pl-60 flex flex-col flex-1">
        {/* Top Bar Component */}
        <header className="h-14 w-full bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Membership Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-semibold text-emerald-700">
                Membership: Active (Expires {formatDate(member?.membership_expiry)})
              </span>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* QR Check-in Button */}
            <Link
              href="/member/profile"
              className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-500" />
              <span>QR Check-in</span>
            </Link>

            <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200"></div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#1E40AF] text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-semibold text-slate-900">{profile?.full_name}</p>
                <p className="text-[10px] text-slate-500">{isPtMember ? "PT Athlete" : "General Member"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile-first Bottom Navigation (for sm/md screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-slate-200 bg-white px-2 flex items-center justify-around z-50 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-slate-600 hover:text-[#1E40AF] px-3 py-1 transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
