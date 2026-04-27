"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { clearAuth } from "@/lib/auth";

const meta: Record<
  string,
  { title?: string; subtitle?: string; icon?: string; showBack?: boolean; showLogout?: boolean }
> = {
  "/conversation": { title: "대화", subtitle: "회상 인터뷰", icon: "🎙", showBack: true },
  "/history": { title: "생애 기록", subtitle: "소중한 이야기", icon: "📖" },
  "/settings": { title: "설정", subtitle: "앱 환경 설정", icon: "⚙" },
};

type ElderHeaderProps = {
  rightSlot?: React.ReactNode;
};

export function ElderHeader({ rightSlot }: ElderHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current = meta[pathname];

  return (
    <header className="remain-app-header px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {current?.showBack ? (
            <button
              aria-label="뒤로가기"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--remain-muted)] transition hover:bg-[color:var(--remain-primary-soft)] hover:text-[var(--remain-primary)]"
              onClick={() => router.push("/home")}
              type="button"
            >
              ←
            </button>
          ) : null}

          {current?.title ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--remain-surface-muted)] text-sm">
                {current.icon}
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-serif text-base font-semibold text-[var(--remain-primary)]">
                  {current.title}
                </h1>
                <p className="text-[10px] text-[var(--remain-muted)]">{current.subtitle}</p>
              </div>
            </div>
          ) : (
            <Logo size="md" />
          )}
        </div>

        {rightSlot ? (
          <div className="flex items-center gap-2">{rightSlot}</div>
        ) : pathname === "/home" ? (
          <button
            className="text-xs text-[var(--remain-muted)] transition hover:text-[#c64545]"
            onClick={() => {
              clearAuth();
              router.replace("/login");
            }}
            type="button"
          >
            로그아웃
          </button>
        ) : pathname === "/history" ? (
          <Link className="text-xs text-[var(--remain-muted)]" href="/conversation">
            대화
          </Link>
        ) : null}
      </div>
    </header>
  );
}
