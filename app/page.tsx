import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, UserCheck, Users, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, must_change_password")
      .eq("id", user.id)
      .single();

    if (profile?.must_change_password) {
      redirect("/change-password");
    }

    if (profile?.role === "OWNER") redirect("/owner");
    if (profile?.role === "TRAINER") redirect("/trainer");
    if (profile?.role === "MEMBER") redirect("/member");
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1E40AF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              A
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#1E40AF]">
                ARK FIT
              </span>
              <span className="text-[11px] text-slate-500 font-medium ml-2 hidden sm:inline">
                Gym Operating System
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="h-8 px-4 bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs rounded transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-[#1E40AF] text-xs font-semibold uppercase tracking-wider mb-5">
          Athletic SaaS Precision
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
          Precision Gym Operations for <br />
          <span className="text-[#1E40AF]">Owners, Trainers & Members</span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
          Comprehensive, floor-tested gym management platform. Built for Indian gyms with automated fee tracking, Razorpay payment links, daily check-in logs, and dedicated personal training workflows.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto h-10 px-6 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>Enter ARK FIT Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Core Roles preview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 w-full text-left">
          <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-blue-50 text-[#1E40AF] border border-blue-200 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Gym Owner Desk</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Action-required alerts, cash/UPI counter collections, online Razorpay settlements, floor attendance, and trainer staff management.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#1E40AF] mt-4 block">Executive Control &rarr;</span>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-3">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Floor Trainer Desk</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Floor-ready mobile dashboard. Scheduled 1-on-1 PT sessions, 1-click atomic session completion, workout routine builder, and structured floor notes.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 mt-4 block">Floor Coaching &rarr;</span>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Athlete Companion</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tailored member experience. Dynamic workout checklist, streak counter, coach floor feedback, and dedicated PT session balance.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 mt-4 block">Member Companion &rarr;</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        ARK FIT • High-Performance Gym Management Platform • Precision Engineering
      </footer>
    </div>
  );
}
