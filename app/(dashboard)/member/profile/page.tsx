import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { User, Building } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function MemberProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
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
        gyms (
          name,
          address,
          phone
        )
      ),
      assigned_trainer:trainers (
        profiles (
          full_name,
          phone
        )
      )
    `)
    .eq("profile_id", user.id)
    .single();

  if (!member) notFound();

  const m = member as any;
  const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
  const trainer = Array.isArray(m.assigned_trainer) ? m.assigned_trainer[0] : m.assigned_trainer;
  const trainerProfile = Array.isArray(trainer?.profiles) ? trainer?.profiles[0] : trainer?.profiles;
  const gym = Array.isArray(profile?.gyms) ? profile?.gyms[0] : profile?.gyms;

  const isPt = m.member_type === "PT";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <section className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          My Athlete Profile
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Account details, assigned trainer information, and gym branch identity.
        </p>
      </section>

      {/* Main Profile Card */}
      <div className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 text-[#1E40AF] font-bold text-lg flex items-center justify-center">
            {profile?.full_name?.slice(0, 2).toUpperCase() || "AF"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{profile?.full_name || "Athlete"}</h2>
              {isPt ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  PT Member
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                  General Member
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">
              Member since {formatDate(m.created_at)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Contact Phone</span>
            <span className="font-semibold text-slate-900 mt-1 block">{profile?.phone || "No phone"}</span>
          </div>

          <div>
            <span className="text-emerald-700 uppercase font-semibold text-[10px] block">Membership Expiry</span>
            <span className="font-semibold text-emerald-700 mt-1 block">
              {formatDate(m.membership_expiry)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Floor Coach</span>
            <span className="font-semibold text-slate-900 mt-1 block">
              {trainerProfile?.full_name || "General Floor Staff"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 uppercase font-semibold text-[10px] block">Emergency Contact</span>
            <span className="font-semibold text-slate-700 mt-1 block">
              {m.emergency_contact || "Not provided"}
            </span>
          </div>
        </div>
      </div>

      {/* Gym Information */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2 text-xs">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-[#1E40AF]" /> {gym?.name || "ARK FIT"}
        </h3>
        <p className="text-slate-600 leading-relaxed">
          {gym?.address || "123 Fitness Boulevard, Koramangala, Bangalore, India"}
        </p>
        <span className="text-slate-500 block">Reception: {gym?.phone || "+91 98765 43210"}</span>
      </div>
    </div>
  );
}
