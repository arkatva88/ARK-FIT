import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Phone } from "lucide-react";
import { MemberProfileTabs } from "@/components/owner/member-profile-tabs";

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function OwnerMemberDetailPage({ params, searchParams }: PageProps) {
  const supabase = createClient();
  const memberId = params.id;
  const currentTab = searchParams.tab || "overview";

  // 1. Fetch Member details
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select(`
      id,
      member_type,
      status,
      membership_expiry,
      emergency_contact,
      medical_conditions,
      created_at,
      profiles (
        full_name,
        phone,
        avatar_url,
        created_at
      ),
      assigned_trainer:trainers (
        id,
        specialization,
        profiles (
          full_name,
          phone
        )
      )
    `)
    .eq("id", memberId)
    .single();

  if (memberErr || !member) {
    notFound();
  }

  // 2. Fetch Memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  // 3. Fetch Attendance (Recent 30 records)
  const { data: attendanceList } = await supabase
    .from("attendance")
    .select("*")
    .eq("member_id", memberId)
    .order("attendance_date", { ascending: false })
    .limit(30);

  const presentCount = attendanceList?.filter((a) => a.status === "PRESENT").length || 0;
  const attendanceRate = attendanceList && attendanceList.length > 0
    ? Math.round((presentCount / attendanceList.length) * 100)
    : 0;

  // 4. Fetch Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  // 5. Fetch PT Packages & PT Sessions
  const { data: ptPackages } = await supabase
    .from("pt_packages")
    .select(`
      *,
      trainer:trainers (
        profiles (full_name)
      )
    `)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  const { data: ptSessions } = await supabase
    .from("pt_sessions")
    .select(`
      *,
      trainer:trainers (
        profiles (full_name)
      )
    `)
    .eq("member_id", memberId)
    .order("session_date", { ascending: false })
    .limit(20);

  // 6. Fetch Workout & Diet Plans
  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "ACTIVE")
    .limit(1);

  const { data: dietPlans } = await supabase
    .from("diet_plans")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "ACTIVE")
    .limit(1);

  // 7. Fetch Progress Records & Photos
  const { data: progressRecords } = await supabase
    .from("progress_records")
    .select("*")
    .eq("member_id", memberId)
    .order("recorded_at", { ascending: false })
    .limit(10);

  const { data: progressPhotos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("member_id", memberId)
    .order("taken_at", { ascending: false })
    .limit(6);

  // 8. Fetch Member Structured Notes
  const { data: memberNotes } = await supabase
    .from("member_notes")
    .select(`
      *,
      trainer:trainers (
        profiles (full_name)
      )
    `)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  const m = member as any;
  const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
  const trainer = Array.isArray(m.assigned_trainer) ? m.assigned_trainer[0] : m.assigned_trainer;
  const trainerProfile = Array.isArray(trainer?.profiles) ? trainer?.profiles[0] : trainer?.profiles;

  const isPt = m.member_type === "PT";
  const activePtPackage = ptPackages?.find((p) => p.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/owner/members"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </Link>

      {/* Member Profile Header Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] font-bold text-lg flex items-center justify-center">
              {profile?.full_name?.slice(0, 2).toUpperCase() || "MB"}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.full_name || "Member"}</h1>
                {isPt ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    PT Member
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    General Member
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                    m.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile?.phone || "No phone registered"}
                </span>
                <span>•</span>
                <span>
                  Coach: <strong className="text-slate-800">{trainerProfile?.full_name || "None Assigned"}</strong>
                </span>
                <span>•</span>
                <span>
                  Expiry: <strong className="text-slate-800">{formatDate(m.membership_expiry)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Attendance Rate</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">{attendanceRate}%</span>
            </div>

            {isPt && activePtPackage && (
              <div className="text-right pl-6 border-l border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-amber-700 block">PT Sessions</span>
                <span className="text-lg font-bold text-amber-800 tabular-nums">
                  {activePtPackage.used_sessions} / {activePtPackage.total_sessions}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9 Tabs Interactive Container */}
      <MemberProfileTabs
        memberId={memberId}
        currentTab={currentTab}
        member={member}
        memberships={memberships || []}
        attendanceList={attendanceList || []}
        payments={payments || []}
        ptPackages={ptPackages || []}
        ptSessions={ptSessions || []}
        workoutPlan={workoutPlans?.[0] || null}
        dietPlan={dietPlans?.[0] || null}
        progressRecords={progressRecords || []}
        progressPhotos={progressPhotos || []}
        memberNotes={memberNotes || []}
      />
    </div>
  );
}
