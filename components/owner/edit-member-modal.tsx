"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Edit2, X, Loader2, Check, AlertTriangle } from "lucide-react";

interface EditMemberModalProps {
  member: any;
  trainers: { id: string; profiles: { full_name: string } | { full_name: string }[] }[];
}

export function EditMemberModal({ member, trainers }: EditMemberModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;

  // Form states
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [emergencyContact, setEmergencyContact] = useState(member.emergency_contact || "");
  const [memberType, setMemberType] = useState<"NORMAL" | "PT">(member.member_type || "NORMAL");
  const [assignedTrainerId, setAssignedTrainerId] = useState<string>(member.assigned_trainer_id || "");
  const [status, setStatus] = useState<"ACTIVE" | "FROZEN" | "EXPIRED">(member.status || "ACTIVE");
  const [membershipExpiry, setMembershipExpiry] = useState(member.membership_expiry || "");
  const [medicalConditions, setMedicalConditions] = useState(member.medical_conditions || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Update Profile (Full name & phone)
      if (profile?.id) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
          })
          .eq("id", profile.id);

        if (profileErr) throw profileErr;
      }

      // 2. Update Member record
      const { error: memberErr } = await supabase
        .from("members")
        .update({
          member_type: memberType,
          assigned_trainer_id: assignedTrainerId || null,
          status,
          membership_expiry: membershipExpiry || null,
          emergency_contact: emergencyContact.trim() || null,
          medical_conditions: medicalConditions.trim() || null,
        })
        .eq("id", member.id);

      if (memberErr) throw memberErr;

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update member details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="h-9 px-3.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <Edit2 className="w-3.5 h-3.5 text-[#1E40AF]" />
        <span>Edit Member</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#1E40AF]" /> Edit Member Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update athlete contact information, coach assignment, and membership status.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Member Type</label>
                  <select
                    value={memberType}
                    onChange={(e: any) => setMemberType(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="NORMAL">Normal / General Member</option>
                    <option value="PT">Personal Training (PT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Assigned Coach</label>
                  <select
                    value={assignedTrainerId}
                    onChange={(e) => setAssignedTrainerId(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="">— None Assigned —</option>
                    {trainers.map((t) => {
                      const tProfile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                      return (
                        <option key={t.id} value={t.id}>
                          {tProfile?.full_name || "Trainer"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="FROZEN">FROZEN / PAUSED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Plan Expiry Date</label>
                  <input
                    type="date"
                    value={membershipExpiry}
                    onChange={(e) => setMembershipExpiry(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Ramesh (Father) - 9876543210"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Medical / Physical Notes</label>
                <textarea
                  rows={2}
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Asthmatic, Right shoulder impingement, Low back history..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-9 px-4 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-5 rounded bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
