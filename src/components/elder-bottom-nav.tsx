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
              className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all ${
                isActive ? "text-[var(--remain-primary)]" : "text-[var(--remain-muted-2)]"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-[18px] ${
                  isActive ? "bg-[color:var(--remain-primary-soft)]" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
