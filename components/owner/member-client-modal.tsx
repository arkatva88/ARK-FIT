"use client";

import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } finally {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-white">Create New Gym Account</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Account will be provisioned with a secure temporary password. First login forces password change.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Account successfully created! Refreshing...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Toggle */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("MEMBER")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "MEMBER"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    Gym Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("TRAINER")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "TRAINER"
                        ? "bg-cyan-500 text-black border-cyan-500"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    Fitness Trainer
                  </button>
                </div>
              </div>

              {/* Member Type (Only for MEMBER) */}
              {role === "MEMBER" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                    Member Type (PT vs Normal)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMemberType("NORMAL")}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        memberType === "NORMAL"
                          ? "bg-secondary text-white border-primary/50"
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      Normal Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberType("PT")}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        memberType === "PT"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-background text-muted-foreground border-border"
                      }`}
                    >
                      ★ Personal Training (PT)
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="member@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Phone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Trainer Assignment for PT or Normal Member */}
              {role === "MEMBER" && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    {memberType === "PT" ? "Dedicated PT Trainer" : "Assigned Floor Trainer (Optional)"}
                  </label>
                  <select
                    value={assignedTrainerId}
                    onChange={(e) => setAssignedTrainerId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Muscle Hypertrophy & Fat Loss"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Temporary Password */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm text-white font-mono"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Share this temporary password with the user. They will be forced to change it on login.
                </span>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
