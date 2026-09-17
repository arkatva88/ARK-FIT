"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Edit2, X, Loader2, Check, AlertTriangle, Power } from "lucide-react";

interface TrainerActionsModalProps {
  trainer: any;
}

export function TrainerActionsModal({ trainer }: TrainerActionsModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronous submission lock
  const isSubmittingRef = useRef(false);

  const profile = Array.isArray(trainer.profiles) ? trainer.profiles[0] : trainer.profiles;

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [specialization, setSpecialization] = useState(trainer.specialization || "");
  const [bio, setBio] = useState(trainer.bio || "");
  const [isActive, setIsActive] = useState<boolean>(trainer.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Update Profile (Name & Phone)
      if (profile?.id || trainer.profile_id) {
        const profileId = profile?.id || trainer.profile_id;
        const { error: pErr } = await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
          })
          .eq("id", profileId);

        if (pErr) throw pErr;
      }

      // 2. Update Trainer record
      const { error: tErr } = await supabase
        .from("trainers")
        .update({
          specialization: specialization.trim() || "Floor Coach",
          bio: bio.trim() || null,
          is_active: isActive,
        })
        .eq("id", trainer.id);

      if (tErr) throw tErr;

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update coach details.");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setToggleLoading(true);
    try {
      const nextStatus = !isActive;
      const { error: tErr } = await supabase
        .from("trainers")
        .update({ is_active: nextStatus })
        .eq("id", trainer.id);

      if (tErr) throw tErr;

      setIsActive(nextStatus);
      router.refresh();
    } catch (err: any) {
      setError("Failed to toggle coach active status: " + err.message);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsOpen(true)}
          className="h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
        >
          <Edit2 className="w-3 h-3 text-[#1E40AF]" />
          <span>Edit</span>
        </button>

        <button
          disabled={toggleLoading}
          onClick={handleToggleActive}
          title={isActive ? "Deactivate Coach" : "Activate Coach"}
          className={`h-7 px-2.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
            isActive
              ? "border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
              : "border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
          }`}
        >
          {toggleLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Power className="w-3 h-3" />
          )}
          <span>{isActive ? "Deactivate" : "Activate"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#1E40AF]" /> Edit Coach Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update trainer specialization, floor bio, and contact credentials.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Strength & Conditioning, Hypertrophy, Calisthenics"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Bio / Floor Profile</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Certified fitness trainer with 5+ years experience in bodybuilding splits and fat-loss protocols..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Staff Status</label>
                <select
                  value={isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                  className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="ACTIVE">Active Staff Member</option>
                  <option value="INACTIVE">Inactive / On Leave</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-9 px-5 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
