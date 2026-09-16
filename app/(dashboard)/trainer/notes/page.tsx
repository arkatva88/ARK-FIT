import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { NoteStatusToggle } from "@/components/trainer/note-status-toggle";
import Link from "next/link";
import { FileText } from "lucide-react";

interface PageProps {
  searchParams: { filter?: string };
}

export const revalidate = 15;

export default async function TrainerNotesPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const filter = searchParams.filter || "ALL";

  const { data: { user } } = await supabase.auth.getUser();

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user?.id)
    .single();

  if (!trainer) {
    return (
      <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
        <h2 className="text-base font-semibold text-slate-900">Trainer Profile Inactive</h2>
        <p className="text-sm text-slate-500 mt-1">Please contact your gym administrator to link your coach account.</p>
      </div>
    );
  }

  // Fetch assigned member IDs
  const { data: myMembers } = await supabase
    .from("members")
    .select("id")
    .eq("assigned_trainer_id", trainer.id);

  const memberIds = myMembers?.map((m) => m.id) || [];

  let query = supabase
    .from("member_notes")
    .select(`
      id,
      title,
      content,
      status,
      created_at,
      members (
        id,
        profiles (full_name)
      )
    `)
    .order("created_at", { ascending: false });

  if (memberIds.length > 0) {
    query = query.in("member_id", memberIds);
  }

  if (filter === "OPEN") {
    query = query.eq("status", "OPEN");
  } else if (filter === "RESOLVED") {
    query = query.eq("status", "RESOLVED");
  }

  const { data: notes } = memberIds.length > 0 ? await query : { data: [] };

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Floor Notes & Athlete Observations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track form corrections, joint discomfort logs, and progressive overload notes from the gym floor.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(["ALL", "OPEN", "RESOLVED"] as const).map((tab) => (
            <Link
              key={tab}
              href={`/trainer/notes?filter=${tab}`}
              className={`h-8 px-3 rounded text-xs font-semibold transition-colors flex items-center ${
                filter === tab
                  ? "bg-[#1E40AF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab === "ALL" ? "All Notes" : tab === "OPEN" ? "Open Issues" : "Resolved"}
            </Link>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {notes && notes.length > 0 ? (
          notes.map((n: any) => {
            const memberProfile = Array.isArray(n.members?.profiles) ? n.members?.profiles[0] : n.members?.profiles;
            return (
              <div key={n.id} className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/trainer/members/${n.members?.id}`}
                      className="font-semibold text-slate-900 hover:text-[#1E40AF] text-sm"
                    >
                      {memberProfile?.full_name || "Athlete"}
                    </Link>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">{n.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{n.content}</p>
                  <span className="text-[11px] text-slate-400 mt-2 block font-mono">
                    Logged on {formatDate(n.created_at)}
                  </span>
                </div>

                <NoteStatusToggle noteId={n.id} currentStatus={n.status} />
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
            No active notes or injury logs recorded. Open an athlete profile from "My Members" to record floor observations.
          </div>
        )}
      </div>
    </div>
  );
}
