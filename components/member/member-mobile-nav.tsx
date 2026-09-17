"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Target, CreditCard, User, CalendarCheck } from "lucide-react";

interface MemberMobileNavProps {
  isPtMember?: boolean;
}

export function MemberMobileNav({ isPtMember = false }: MemberMobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/member", icon: Home, exact: true },
    { label: "Workout", href: "/member/workout", icon: Dumbbell },
    ...(isPtMember
      ? [{ label: "PT Sessions", href: "/member/pt", icon: Target }]
      : [{ label: "Attendance", href: "/member/attendance", icon: CalendarCheck }]),
    { label: "Billing", href: "/member/payments", icon: CreditCard },
    { label: "Profile", href: "/member/profile", icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white border-t border-slate-200 z-40 px-2 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive
                ? "text-[#1E40AF] font-bold"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#1E40AF] rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
