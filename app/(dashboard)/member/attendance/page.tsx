import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function MemberAttendancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase.from("members").select("id").eq("profile_id", user.id).single();
  if (!member) notFound();

  // Fetch recent 30 attendance records
  const { data: attendanceList } = await supabase
    .from("attendance")
    .select("*")
    .eq("member_id", member.id)
    .order("attendance_date", { ascending: false })
    .limit(30);

  const presentDays = attendanceList?.filter((a) => a.status === "PRESENT").length || 0;
  const totalLogged = attendanceList?.length || 0;
  const attendanceRate = totalLogged > 0 ? Math.round((presentDays / totalLogged) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Attendance Calendar
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your workout consistency and gym floor check-in history.
        </p>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Workouts Done</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block tabular-nums">{presentDays}</span>
        </div>
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rest Days</span>
          <span className="text-2xl font-bold text-slate-700 mt-1 block tabular-nums">{totalLogged - presentDays}</span>
        </div>
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Consistency</span>
          <span className="text-2xl font-bold text-blue-800 mt-1 block tabular-nums">{attendanceRate}%</span>
        </div>
      </section>

      {/* Recent Check-in Logs */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Check-in Logs</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {attendanceList && attendanceList.length > 0 ? (
            attendanceList.map((a: any) => (
              <div
                key={a.id}
                className={`p-3 rounded border text-center ${
                  a.status === "PRESENT"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span className="text-xs font-semibold block">{formatDate(a.attendance_date)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1 block">
                  {a.status}
                </span>
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
