import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { NoteStatusToggle } from "@/components/trainer/note-status-toggle";

export default async function TrainerNotesPage() {
  const supabase = createClient();

  const { data: notes } = await supabase
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

  return (
    <div className="space-y-6">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Floor Notes & Athlete Observations</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track form corrections, joint discomfort logs, and progressive overload notes from the gym floor.
        </p>
      </section>

      <div className="space-y-3">
        {notes && notes.length > 0 ? (
          notes.map((n: any) => {
            const memberProfile = Array.isArray(n.members?.profiles) ? n.members?.profiles[0] : n.members?.profiles;
            return (
              <div key={n.id} className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{memberProfile?.full_name || "Athlete"}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">{n.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.content}</p>
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
            No active notes or injury logs recorded.
          </div>
        )}
      </div>
    </div>
  );
}
