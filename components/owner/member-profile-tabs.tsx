"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LayoutDashboard,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Salad,
  Target,
  TrendingUp,
  FileText,
  Clock,
} from "lucide-react";

interface MemberProfileTabsProps {
  memberId: string;
  currentTab: string;
  member: any;
  memberships: any[];
  attendanceList: any[];
  payments: any[];
  ptPackages: any[];
  ptSessions: any[];
  workoutPlan: any;
  dietPlan: any;
  progressRecords: any[];
  progressPhotos: any[];
  memberNotes: any[];
}

export function MemberProfileTabs({
  currentTab: defaultTab,
  member,
  memberships,
  attendanceList,
  payments,
  ptPackages,
  ptSessions,
  workoutPlan,
  dietPlan,
  progressRecords,
  memberNotes,
}: MemberProfileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const isPt = member.member_type === "PT";

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "membership", label: "Membership", icon: ShieldCheck },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "diet", label: "Diet Plan", icon: Salad },
    { id: "pt", label: "PT Sessions", icon: Target, isPt: true },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "notes", label: "Notes", icon: FileText },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 h-8 px-3.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[#1E40AF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.isPt && isPt && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Member Timeline */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Member Status</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">{member.status}</span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Plan Expiry</span>
                <span className="text-base font-bold text-emerald-700 mt-1 block">
                  {formatDate(member.membership_expiry)}
                </span>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm col-span-2 sm:col-span-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Emergency Contact</span>
                <span className="text-xs font-semibold text-slate-900 mt-1 block truncate">
                  {member.emergency_contact || "Not provided"}
                </span>
              </div>
            </div>

            {/* Member Timeline */}
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E40AF]" /> Member Activity Timeline
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">Enrolled in Gym</span>
                    <span className="text-[11px] text-slate-500 block">{formatDate(member.created_at)}</span>
                  </div>
                </div>

                {memberships.map((m) => (
                  <div key={m.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Membership: {m.plan_name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {formatCurrency(m.amount)} • Valid until {formatDate(m.expiry_date)}
                      </span>
                    </div>
                  </div>
                ))}

                {isPt && ptPackages.map((pkg) => (
                  <div key={pkg.id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white" />
                    <div>
                      <span className="text-xs font-semibold text-amber-800 block">PT Package: {pkg.package_name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {pkg.used_sessions} of {pkg.total_sessions} sessions completed ({pkg.remaining_sessions} left)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Medical & Trainer details */}
          <div className="space-y-5">
            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Health & Medical</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {member.medical_conditions || "No known medical conditions or injuries reported."}
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Trainer</h4>
              {member.assigned_trainer ? (
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {member.assigned_trainer.profiles?.full_name}
                  </span>
                  <span className="text-xs text-[#1E40AF] font-medium block mt-0.5">
                    {member.assigned_trainer.specialization || "Fitness Coach"}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    {member.assigned_trainer.profiles?.phone || ""}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No dedicated trainer assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Membership */}
      {activeTab === "membership" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Membership Plans</h3>
          <div className="divide-y divide-slate-100">
            {memberships.length > 0 ? (
              memberships.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">{m.plan_name}</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(m.start_date)} &rarr; {formatDate(m.expiry_date)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 block tabular-nums">{formatCurrency(m.amount)}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-4">No membership plans recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === "attendance" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Attendance Logs (Recent 30)</h3>
            <span className="text-xs font-semibold text-emerald-700">
              {attendanceList.filter((a) => a.status === "PRESENT").length} Present Sessions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {attendanceList.length > 0 ? (
              attendanceList.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded border text-center ${
                    a.status === "PRESENT"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="text-xs font-semibold block">{formatDate(a.attendance_date)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 block">{a.status}</span>
                </div>
              ))
            ) : (
              <p className="col-span-full text-xs text-slate-400 italic text-center py-6">
                No attendance logs found for this member.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === "payments" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payment Records</h3>
          <div className="divide-y divide-slate-100">
            {payments.length > 0 ? (
              payments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{p.notes || "Gym Fee"}</span>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(p.created_at)} • Method: {p.payment_method}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 block tabular-nums">{formatCurrency(p.amount)}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        p.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-4">No payments recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Workout */}
      {activeTab === "workout" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Workout Routine</h3>
          {workoutPlan ? (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#1E40AF]">{workoutPlan.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workoutPlan.days?.map((day: any, idx: number) => (
                  <div key={idx} className="p-4 rounded border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                      {day.day} — {day.focus}
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {day.exercises?.map((ex: any, i: number) => (
                        <li key={i} className="flex justify-between border-b border-slate-200/60 py-1 last:border-0">
                          <span className="text-slate-900 font-medium">{ex.name}</span>
                          <span className="font-mono text-slate-500">{ex.sets} × {ex.reps}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No active workout plan assigned.</p>
          )}
        </div>
      )}

      {/* Tab 6: Diet */}
      {activeTab === "diet" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assigned Diet Plan</h3>
          {dietPlan ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  {dietPlan.calories} kcal
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  {dietPlan.protein_grams}g Protein
                </span>
                <span className="text-slate-600 uppercase font-semibold">
                  Goal: {dietPlan.goal}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dietPlan.meals?.map((meal: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{meal.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{meal.time}</span>
                    </div>
                    <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
                      {meal.items?.map((it: string, i: number) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No diet plan assigned.</p>
          )}
        </div>
      )}

      {/* Tab 7: PT Sessions */}
      {activeTab === "pt" && (
        <div className="space-y-5">
          {isPt ? (
            <>
              <div className="p-5 rounded-lg border border-amber-200 bg-amber-50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Active PT Package
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {ptPackages[0]?.package_name || "Personal Training Package"}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-amber-800 block tabular-nums">
                      {ptPackages[0]?.remaining_sessions} Left
                    </span>
                    <span className="text-xs text-slate-600">
                      of {ptPackages[0]?.total_sessions} total sessions
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">PT Sessions History</h3>
                <div className="divide-y divide-slate-100">
                  {ptSessions.length > 0 ? (
                    ptSessions.map((s) => (
                      <div key={s.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Session #{s.session_number}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {s.session_time.slice(0, 5)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {formatDate(s.session_date)} • Coach: {s.trainer?.profiles?.full_name || "Trainer"}
                          </span>
                          {s.trainer_notes && (
                            <p className="text-xs text-slate-700 italic mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                              "{s.trainer_notes}"
                            </p>
                          )}
                        </div>
                        <div>
                          <span
                            className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                              s.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : s.status === "SCHEDULED"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4">No PT sessions logged yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg bg-white">
              <Target className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-900">Normal Member</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                This client is enrolled as a Normal Member. Upgrade to Personal Training (PT) to assign packages and schedule dedicated one-on-one floor sessions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Progress */}
      {activeTab === "progress" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Body Measurements & Strength</h3>
          <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Weight (kg)</th>
                  <th className="px-3 py-2">Chest (&quot;)</th>
                  <th className="px-3 py-2">Waist (&quot;)</th>
                  <th className="px-3 py-2">Bench (kg)</th>
                  <th className="px-3 py-2">Squat (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progressRecords.length > 0 ? (
                  progressRecords.map((r) => (
                    <tr key={r.id} className="text-slate-800 hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{formatDate(r.recorded_at)}</td>
                      <td className="px-3 py-2.5 font-bold text-[#1E40AF] tabular-nums whitespace-nowrap">{r.weight_kg || "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">{r.chest_inches || "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">{r.waist_inches || "—"}</td>
                      <td className="px-3 py-2.5 font-semibold text-emerald-700 tabular-nums whitespace-nowrap">{r.bench_press_kg || "—"}</td>
                      <td className="px-3 py-2.5 font-semibold text-blue-700 tabular-nums whitespace-nowrap">{r.squat_kg || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No progress records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 9: Notes */}
      {activeTab === "notes" && (
        <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trainer Structured Notes</h3>
          <div className="space-y-3">
            {memberNotes.length > 0 ? (
              memberNotes.map((n) => (
                <div key={n.id} className="p-4 rounded border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-xs font-bold text-slate-900">{n.title}</h5>
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        n.status === "OPEN" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {n.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.content}</p>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    {formatDate(n.created_at)} • Coach: {n.trainer?.profiles?.full_name || "Trainer"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-4">No notes recorded for this member.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
