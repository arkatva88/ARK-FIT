import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { AttendanceClientList } from "@/components/owner/attendance-client-list";
import { GymQrModal } from "@/components/owner/gym-qr-modal";

interface PageProps {
  searchParams: {
    date?: string;
    filter?: string;
    q?: string;
  };
}

export default async function OwnerAttendancePage({ searchParams }: PageProps) {
  const supabase = createClient();
  const selectedDate = searchParams.date || new Date().toISOString().split("T")[0];
  const filter = searchParams.filter || "all";
  const query = searchParams.q || "";

  // 1. Fetch all active members
  let membersQuery = supabase
    .from("members")
    .select(`
      id,
      member_type,
      status,
      profiles (
        full_name,
        phone
      ),
      assigned_trainer:trainers (
        profiles (full_name)
      )
    `)
    .eq("status", "ACTIVE");

  if (query) {
    membersQuery = membersQuery.ilike("profiles.full_name", `%${query}%`);
  }

  const { data: members } = await membersQuery;

  // 2. Fetch attendance for selected date
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("*")
    .eq("attendance_date", selectedDate);

  const attendanceMap = new Map<string, any>();
  attendanceRecords?.forEach((rec) => attendanceMap.set(rec.member_id, rec));

  // Merge attendance with members
  const memberListWithAttendance = members?.map((m: any) => {
    const att = attendanceMap.get(m.id);
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const trainerProfile = Array.isArray(m.assigned_trainer?.profiles)
      ? m.assigned_trainer?.profiles[0]
      : m.assigned_trainer?.profiles;

    return {
      ...m,
      profiles: profile,
      assigned_trainer: m.assigned_trainer ? { profiles: trainerProfile } : null,
      attendance_status: att ? att.status : "ABSENT",
      check_in_time: att ? att.check_in_time : null,
      attendance_id: att ? att.id : null,
      method: att ? att.method : null,
    };
  }) || [];

  const totalMembers = memberListWithAttendance.length;
  const presentCount = memberListWithAttendance.filter((m) => m.attendance_status === "PRESENT").length;
  const absentCount = totalMembers - presentCount;
  const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Date Selector */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Attendance Desk</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time daily athlete check-in logs and floor presence records for {formatDate(selectedDate)}.
          </p>
        </div>

        {/* Date Selector & Gym QR Modal */}
        <div className="flex flex-wrap items-center gap-3">
          <GymQrModal buttonText="Reception QR Station" />
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-blue-700"
            />
            <button
              type="submit"
              className="h-9 px-4 bg-[#1E40AF] text-white hover:bg-blue-800 font-medium text-sm rounded shadow-sm transition-colors"
            >
              Load Date
            </button>
          </form>
        </div>
      </section>

      {/* 2. Three Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active Enrolled */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Members</span>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{totalMembers}</div>
          <p className="text-xs text-slate-500 mt-1">Total active gym members</p>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Present Today</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tabular-nums">{presentCount}</div>
          <p className="text-xs text-slate-500 mt-1">{attendanceRate}% turn-out rate</p>
        </div>

        {/* Card 3: Absent */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent</span>
            <span className="inline-block w-2 h-2 rounded-full bg-slate-300"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700 tabular-nums">{absentCount}</div>
          <p className="text-xs text-slate-500 mt-1">Yet to check in today</p>
        </div>
      </section>

      {/* 3. Interactive Client Attendance List */}
      <AttendanceClientList
        selectedDate={selectedDate}
        members={memberListWithAttendance}
      />
    </div>
  );
}
