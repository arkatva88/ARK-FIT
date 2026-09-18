"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, KeyRound, AlertCircle, CheckCircle } from "lucide-react";

interface MemberClientModalProps {
  trainers: any[];
  isOpenDefault?: boolean;
}

export function MemberClientModal({ trainers, isOpenDefault = false }: MemberClientModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [role, setRole] = useState<"MEMBER" | "TRAINER">("MEMBER");
  const [memberType, setMemberType] = useState<"NORMAL" | "PT">("NORMAL");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedTrainerId, setAssignedTrainerId] = useState("");
  const [specialization, setSpecialization] = useState("Strength & Conditioning");
  const [tempPassword, setTempPassword] = useState("ArkFit@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Synchronous submission lock
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          temporaryPassword: tempPassword,
          fullName,
          phone,
          role,
          memberType: role === "MEMBER" ? memberType : undefined,
          assignedTrainerId: assignedTrainerId || undefined,
          specialization: role === "TRAINER" ? specialization : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-all shadow-md shadow-primary/20"
      >
        <Plus className="w-4 h-4" /> Add New Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Create New Gym Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Account will be provisioned with a secure temporary password. First login forces password change.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Account successfully created! Refreshing...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("MEMBER")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      role === "MEMBER"
                        ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Gym Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("TRAINER")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      role === "TRAINER"
                        ? "bg-[#1E40AF] text-white border-[#1E40AF] shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Fitness Trainer
                  </button>
                </div>
              </div>

              {/* Member Type (Only for MEMBER) */}
              {role === "MEMBER" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                    Member Type (PT vs Normal)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMemberType("NORMAL")}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        memberType === "NORMAL"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Normal Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberType("PT")}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        memberType === "PT"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Personal Training (PT)
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="member@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Phone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                  />
                </div>
              </div>

              {/* Trainer Assignment for PT or Normal Member */}
              {role === "MEMBER" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {memberType === "PT" ? "Dedicated PT Trainer" : "Assigned Floor Trainer (Optional)"}
                  </label>
                  <select
                    value={assignedTrainerId}
                    onChange={(e) => setAssignedTrainerId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                  >
                    <option value="">— Select Trainer —</option>
                    {trainers.map((t) => {
                      const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                      return (
                        <option key={t.id} value={t.id}>
                          {profile?.full_name || "Trainer"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Trainer Specialization */}
              {role === "TRAINER" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Muscle Hypertrophy & Fat Loss"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                  />
                </div>
              )}

              {/* Temporary Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Share this temporary password with the user. They will be forced to change it on login.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    "Create Account"
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
