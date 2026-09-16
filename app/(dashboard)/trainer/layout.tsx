import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  Target,
  Dumbbell,
  Salad,
  TrendingUp,
  FileText,
  LogOut,
  Search,
  Bell,
  CheckSquare,
} from "lucide-react";

export default async function TrainerLayout({
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

  if (profile?.role !== "TRAINER") {
    redirect(profile?.role === "OWNER" ? "/owner" : "/member");
  }

  const gymName = (profile as any)?.gyms?.name || "ARK FIT";

  const navItems = [
    { label: "Today", href: "/trainer", icon: Calendar },
    { label: "My Members", href: "/trainer/members", icon: Users },
    { label: "PT Sessions", href: "/trainer/pt-sessions", icon: Target },
    { label: "Workouts", href: "/trainer/workouts", icon: Dumbbell },
    { label: "Diet", href: "/trainer/diet", icon: Salad },
    { label: "Progress", href: "/trainer/progress", icon: TrendingUp },
    { label: "Floor Notes", href: "/trainer/notes", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* SIDEBAR (Persistent Desktop Rail 240px) */}
      <aside className="hidden lg:flex flex-col justify-between h-screen w-60 p-3 fixed left-0 top-0 z-40 bg-white border-r border-slate-200">
        <div className="flex flex-col gap-5">
          {/* Brand & Branch Identity */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded bg-[#1E40AF] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              A
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#1E40AF] leading-none">ARK FIT</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{gymName} • Coach Desk</div>
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
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Action & Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-3">
          <Link
            href="/trainer/pt-sessions"
            className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-[#1E40AF] border border-slate-200 rounded font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Floor Check-in</span>
          </Link>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-1.5 rounded text-slate-500 font-medium text-xs hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* TOP BAR (Sticky Navigation Full Width with 240px offset on LG) */}
      <header className="sticky top-0 z-30 flex justify-between items-center h-14 bg-white border-b border-slate-200 px-4 sm:px-6 lg:ml-60">
        {/* Left: Search Box */}
        <div className="flex items-center gap-3 w-64 sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned athlete..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded focus:border-[#1E40AF] focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right: Contextual Status & Profile Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Shift Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded border border-slate-200 text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Floor Shift: Active Today</span>
          </div>

          <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 relative transition-colors">
            <Bell className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200"></div>

          {/* Trainer Avatar & Name */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded bg-[#1E40AF] text-white flex items-center justify-center font-bold text-xs">
              {profile?.full_name?.slice(0, 2).toUpperCase() || "TR"}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-semibold text-slate-900">{profile?.full_name}</div>
              <div className="text-[10px] text-slate-500">Coach</div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="lg:ml-60 flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
