"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Dumbbell,
  Clock,
  ArrowRight,
  LogIn,
  Loader2,
  Sparkles,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

function QrAttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const code = searchParams.get("code");

  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  const hasTriggeredRef = useRef(false);

  // Check auth session
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuthenticated(true);
          // Automatically trigger check-in if code is present
          if (code && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            handleCheckIn(code);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoadingUser(false);
      }
    }

    checkAuth();
  }, [code]);

  const handleCheckIn = async (qrToken: string) => {
    setCheckingIn(true);
    setError(null);

    try {
      const res = await fetch("/api/attendance/qr-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: qrToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "MEMBERSHIP_EXPIRED") {
          setExpiryDate(data.expiryDate || null);
        }
        throw new Error(data.message || data.error || "Failed to record attendance");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to complete check-in");
    } finally {
      setCheckingIn(false);
    }
  };

  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(`/attendance/qr?code=${code || ""}`)}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center text-white font-bold text-xl shadow-sm">
            A
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A] block leading-none">
              ARK FIT
            </span>
            <span className="text-xs text-[#64748B] font-medium block mt-0.5">
              Floor Check-In Desk
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm space-y-6">
          {/* Missing Code State */}
          {!code ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h1 className="text-base font-bold text-[#0F172A]">Invalid Check-in Code</h1>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                No attendance code was detected. Please scan the official ARK FIT gym QR code at the entrance.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors mt-2"
              >
                <span>Go to Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : loadingUser || checkingIn ? (
            /* Loading State */
            <div className="text-center py-10 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF] mx-auto" />
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  {loadingUser ? "Verifying Session..." : "Recording Attendance..."}
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Communicating with ARK FIT floor servers...
                </p>
              </div>
            </div>
          ) : !isAuthenticated ? (
            /* Unauthenticated State */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                <CalendarCheck className="w-7 h-7" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  Gym Attendance Check-in
                </h1>
                <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto">
                  Please sign in to verify your active athlete membership and register your gym attendance.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={loginRedirectUrl}
                  className="w-full h-11 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Check In</span>
                </Link>
              </div>

              <p className="text-[11px] text-[#94A3B8]">
                Your check-in will automatically complete immediately after signing in.
              </p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Check-In Incomplete</h2>
                <p className="text-xs text-rose-700 mt-1 max-w-xs mx-auto">{error}</p>
              </div>

              {expiryDate ? (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-2">
                  <span className="block font-semibold">Expired Subscription</span>
                  <Link
                    href="/member/payments"
                    className="w-full h-9 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Renew Membership Online</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckIn(code)}
                  className="h-9 px-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Try Again
                </button>
              )}

              <div className="pt-2 border-t border-slate-100">
                <Link href="/member" className="text-xs font-semibold text-[#1E40AF] hover:underline">
                  Go to Member Dashboard &rarr;
                </Link>
              </div>
            </div>
          ) : result ? (
            /* Success State */
            <div className="text-center py-2 space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  {result.status === "ALREADY_CHECKED_IN" ? "Already Checked In" : "Attendance Confirmed"}
                </span>
                <h1 className="text-lg font-bold text-[#0F172A] tracking-tight">{result.message}</h1>
                {result.checkInTime && (
                  <p className="text-xs text-slate-500 font-mono mt-1 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Checked in at: {new Date(result.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </p>
                )}
              </div>

              {/* Today's Workout Preview */}
              {result.todayWorkout && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-left space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-[#1E40AF]" />
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Today's Scheduled Split
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-700 font-semibold">
                      {result.todayWorkout.day_name || "Today"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">{result.todayWorkout.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {result.todayWorkout.exercises?.length || 4} targeted exercises assigned on your split.
                    </p>
                  </div>

                  <Link
                    href="/member/workout"
                    className="w-full h-9 rounded bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Start Floor Workout</span>
                  </Link>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">ARK FIT Facility Check-in</span>
                <Link href="/member" className="text-[#1E40AF] font-semibold hover:underline">
                  Dashboard &rarr;
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-[11px] text-[#94A3B8]">
          ARK FIT · Fast Floor Check-In System
        </div>
      </div>
    </div>
  );
}

export default function QrAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E40AF] mx-auto" />
            <h2 className="text-sm font-bold text-[#0F172A]">Loading Check-in Station...</h2>
            <p className="text-xs text-[#64748B]">Preparing floor scanner...</p>
          </div>
        </div>
      }
    >
      <QrAttendanceContent />
    </Suspense>
  );
}
