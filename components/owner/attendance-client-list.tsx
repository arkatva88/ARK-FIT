"use client";

import { useState } from "react";
import { Search, CheckCircle2, XCircle, Loader2, QrCode, UserCheck } from "lucide-react";
import Link from "next/link";

interface MemberAttendanceItem {
  id: string;
  member_type: "NORMAL" | "PT";
  attendance_status: "PRESENT" | "ABSENT";
  check_in_time?: string | null;
  method?: string | null;
  profiles?: { full_name?: string; phone?: string };
  assigned_trainer?: { profiles?: { full_name?: string } };
}

interface AttendanceClientListProps {
  selectedDate: string;
  members: MemberAttendanceItem[];
}

export function AttendanceClientList({ selectedDate, members: initialMembers }: AttendanceClientListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "PT">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const toggleAttendance = async (memberId: string, currentStatus: "PRESENT" | "ABSENT") => {
    const nextStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";
    setUpdatingId(memberId);

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              attendance_status: nextStatus,
              check_in_time: nextStatus === "PRESENT" ? new Date().toISOString() : null,
              method: nextStatus === "PRESENT" ? "MANUAL_OWNER" : null,
            }
          : m
      )
    );

    try {
      // Call authoritative server route enforcing same-gym isolation, role auditing, and workout schedule synchronization
      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          date: selectedDate,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update attendance");

      if (data.attendance) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  attendance_status: data.attendance.status,
                  check_in_time: data.attendance.check_in_time,
                  method: data.attendance.method,
                }
              : m
          )
        );
      }
    } catch (err: any) {
      console.error("Attendance update failed:", err);
      // Revert optimistic update
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, attendance_status: currentStatus } : m))
      );
      alert("Failed to update attendance: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesQuery = m.profiles?.full_name?.toLowerCase().includes(query.toLowerCase()) || false;
    if (!matchesQuery) return false;

    if (filter === "PRESENT") return m.attendance_status === "PRESENT";
    if (filter === "ABSENT") return m.attendance_status === "ABSENT";
    if (filter === "PT") return m.member_type === "PT";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search athlete by name..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-700 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(["ALL", "PRESENT", "ABSENT", "PT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`h-8 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                filter === tab
                  ? "bg-[#1E40AF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab === "ALL" ? "All Athletes" : tab === "PRESENT" ? "Present" : tab === "ABSENT" ? "Absent" : "PT Members"}
            </button>
          ))}
        </div>
      </div>

      {/* Athletes Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-left text-sm min-w-[660px]">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              <tr>
                <th className="px-5 py-3">Athlete</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Assigned Coach</th>
                <th className="px-5 py-3">Check-in Time</th>
                <th className="px-5 py-3 text-right">Floor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const isPresent = m.attendance_status === "PRESENT";
                  const isUpdating = updatingId === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isPresent
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {m.profiles?.full_name?.slice(0, 2).toUpperCase() || "MB"}
                          </div>
                          <div>
                            <Link
                              href={`/owner/members/${m.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-700 block text-sm"
                            >
                              {m.profiles?.full_name || "Athlete"}
                            </Link>
                            <span className="text-xs text-slate-400 block">{m.profiles?.phone || "No phone"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {m.member_type === "PT" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            PT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                            General
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium whitespace-nowrap">
                        {m.assigned_trainer?.profiles?.full_name || "Floor Trainer"}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {m.check_in_time ? (
                          <div className="space-y-1">
                            <span className="text-xs text-slate-700 font-mono block">
                              {new Date(m.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {m.method === "QR" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                <QrCode className="w-2.5 h-2.5" /> QR Scan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                <UserCheck className="w-2.5 h-2.5 text-slate-400" /> Staff
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleAttendance(m.id, m.attendance_status)}
                          disabled={isUpdating}
                          className={`h-8 px-3.5 rounded text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 ${
                            isPresent
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                              : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                          ) : isPresent ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" /> Absent
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No athletes found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
