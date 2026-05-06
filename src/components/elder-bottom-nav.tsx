"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "홈", icon: "⌂" },
  { href: "/conversation", label: "대화", icon: "🎙" },
  { href: "/history", label: "기록", icon: "📖" },
  { href: "/settings", label: "설정", icon: "⚙" },
];

export function ElderBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="remain-bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[68px] flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-all ${
                isActive
                  ? "bg-[color:var(--remain-primary-soft)] text-[var(--remain-primary)]"
                  : "text-[var(--remain-muted)] hover:bg-white/70"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-[19px] ${
                  isActive ? "bg-white shadow-[0_6px_14px_rgba(31,45,74,0.10)]" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
