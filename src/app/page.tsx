"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { getStoredAuth } from "@/lib/auth";

const chips = ["AI 음성 대화", "생애 기록 보관", "회상치료 전문"];

export default function Page() {
  const router = useRouter();
  const [hasAuth] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(getStoredAuth());
  });

  useEffect(() => {
    if (hasAuth) {
      router.replace("/home");
    }
  }, [hasAuth, router]);

  if (hasAuth) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Logo size="lg" />
          <p className="mt-5 text-sm text-[#667085]">기억을 불러오는 중이에요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell flex min-h-screen justify-center px-4 py-6">
      <div className="remain-mobile-shell">
        <div className="remain-page flex flex-col items-center justify-center px-6 py-8 text-center">
          <div className="mb-9">
            <Logo size="lg" />
            <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[var(--remain-muted)]">
              회상치료 AI 인터뷰
            </p>
          </div>

          <div className="mb-8 max-w-xs space-y-3">
            <h1 className="font-serif text-[32px] font-semibold leading-tight text-[var(--remain-primary)]">
              어르신의 이야기를
              <br />
              소중히 기록합니다
            </h1>
            <p className="text-sm leading-7 text-[var(--remain-muted)]">
              AI가 따뜻한 대화 상대가 되어 생애 이야기를 듣고 기록합니다
            </p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <Link className="remain-primary-button flex w-full justify-center" href="/login">
              시작하기 →
            </Link>
            <p className="rounded-2xl border border-[var(--remain-border)] bg-white/65 px-4 py-3 text-xs leading-5 text-[var(--remain-muted)]">
              어르신 계정은 관리자 화면에서 미리 만들어드릴 수 있어요
            </p>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {chips.map((chip) => (
              <span key={chip} className="remain-chip rounded-full px-3 py-1.5 text-xs">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
