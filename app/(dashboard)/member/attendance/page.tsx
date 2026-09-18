import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { QrCode, CheckCircle2, ArrowRight, Dumbbell } from "lucide-react";

export default async function MemberAttendancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase.from("members").select("id").eq("profile_id", user.id).single();
  if (!member) notFound();

  // Fetch recent 30 attendance records
  const { data: attendanceList } = await supabase
    .from("attendance")
    .select("id, attendance_date, status, check_in_time, method")
    .eq("member_id", member.id)
    .order("attendance_date", { ascending: false })
    .limit(30);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendanceList?.find((a) => a.attendance_date === today);
  const isCheckedInToday = todayRecord?.status === "PRESENT";

  const presentDays = attendanceList?.filter((a) => a.status === "PRESENT").length || 0;
  const totalLogged = attendanceList?.length || 0;
  const attendanceRate = totalLogged > 0 ? Math.round((presentDays / totalLogged) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting */}
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Attendance & Floor Presence
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your daily check-in logs, consistency metrics, and workout visit records.
          </p>
        </div>

        <Link
          href="/attendance/qr"
          className="inline-flex items-center gap-2 h-9 px-4 rounded bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Gym QR</span>
        </Link>
      </section>

      {/* 2. Today's Check-In Hero Card */}
      {isCheckedInToday ? (
        <section className="p-5 rounded-lg border border-emerald-200 bg-emerald-50/70 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-emerald-950">You are Checked In Today!</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                  PRESENT
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Logged at{" "}
                {todayRecord?.check_in_time
                  ? new Date(todayRecord.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Today"}
                {" • "}
                {todayRecord?.method === "QR" ? "Self check-in via Gym QR" : "Marked by Gym Staff"}
              </p>
            </div>
          </div>

          <Link
            href="/member/workout"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Open Today's Workout</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </section>
      ) : (
        <section className="p-5 rounded-lg border border-blue-200 bg-blue-50/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[#1E40AF] shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Check In at Your Gym</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Scan the ARK FIT QR poster at the gym entrance or reception to automatically verify floor presence and activate today's workout split.
              </p>
            </div>
          </div>

          <Link
            href="/attendance/qr"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded bg-[#1E40AF] text-white hover:bg-blue-800 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Check In Now</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </section>
      )}

      {/* 3. Consistency Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Workouts Done</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block tabular-nums">{presentDays}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Logged sessions</span>
        </div>
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rest / Inactive</span>
          <span className="text-2xl font-bold text-slate-700 mt-1 block tabular-nums">{totalLogged - presentDays}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Recovery days</span>
        </div>
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Consistency Rate</span>
          <span className="text-2xl font-bold text-blue-800 mt-1 block tabular-nums">{attendanceRate}%</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Monthly turn-out</span>
        </div>
      </section>

      {/* 4. Recent Check-in Logs */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Check-in Logs (Last 30 Days)</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {attendanceList && attendanceList.length > 0 ? (
            attendanceList.map((a: any) => (
              <div
                key={a.id}
                className={`p-3 rounded border text-center transition-all ${
                  a.status === "PRESENT"
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span className="text-xs font-semibold block">{formatDate(a.attendance_date)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1 block">
                  {a.status}
                </span>
                {a.check_in_time && (
                  <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                    {new Date(a.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {a.method === "QR" && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 mt-1">
                    <QrCode className="w-2.5 h-2.5" /> QR
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-xs text-slate-400 italic text-center py-6">
              No check-ins logged yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
