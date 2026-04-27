"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { getSessionStats } from "@/lib/api";
import { clearAuth, getStoredAuth } from "@/lib/auth";
import type { SessionStats, StoredAuth } from "@/lib/types";

function greetingByHour() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "좋은 아침이에요";
  }

  if (hour < 18) {
    return "좋은 오후예요";
  }

  return "좋은 저녁이에요";
}

export default function HomePage() {
  const router = useRouter();
  const [auth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    lastSessionDate: null,
  });

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }

    getSessionStats(auth.userId, auth.token)
      .then(setStats)
      .catch(() => {
        setStats({ totalSessions: 0, lastSessionDate: null });
      });
  }, [auth, router]);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <main className="app-shell flex min-h-screen justify-center px-5 py-8">
      <div className="v1-mobile-frame v1-screen flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col px-7 py-5">
        <header className="mb-9 flex items-center justify-between">
          <Logo />
          <button className="text-[13px] text-[#33384A]" onClick={handleLogout} type="button">
            로그아웃
          </button>
        </header>

        <section className="mb-3">
          <h1 className="mb-1 text-[22px] font-bold text-[#EEEDFE]">
            {auth?.name || "회원"}님,
          </h1>
          <p className="whitespace-pre-line text-sm leading-6 text-[#555A6B]">
            {stats.totalSessions === 0
              ? "첫 번째 이야기를 시작해볼까요?"
              : `${greetingByHour()}\n지난 ${stats.totalSessions}번의 대화를 모두 기억하고 있어요.`}
          </p>
        </section>

        <section className="relative flex flex-1 items-center justify-center">
          <span className="v1-orb-ring" />
          <span className="v1-orb-ring delay" />

          <Link
            className="v1-pulse relative z-10 flex h-[220px] w-[220px] flex-col items-center justify-center rounded-full border-[1.5px] border-[#185FA5] bg-[#0D1929] text-center"
            href="/conversation"
          >
            <span className="text-[46px]">🎙</span>
            <span className="mt-2 text-[22px] font-bold text-[#EEEDFE]">대화 시작</span>
            <span className="mt-1 flex items-baseline text-[13px] text-[#555A6B]">
              <span className="text-[#EEEDFE]/60">rem</span>
              <span className="font-bold text-[#378ADD]">AI</span>
              <span className="text-[#EEEDFE]/60">n</span>
              <span>&nbsp;와 30분</span>
            </span>
          </Link>
        </section>

        <section className="space-y-4 pb-2">
          {stats.totalSessions > 0 ? (
            <div className="v1-card flex items-center justify-center px-6 py-4">
              <div className="flex-1 text-center">
                <p className="text-[18px] font-bold text-[#378ADD]">{stats.totalSessions}</p>
                <p className="mt-1 text-xs text-[#444A59]">총 대화</p>
              </div>
              <div className="h-8 w-px bg-[#1e1e2e]" />
              <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-[#EEEDFE]">
                  {stats.lastSessionDate
                    ? new Date(stats.lastSessionDate).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-[#444A59]">마지막 대화</p>
              </div>
            </div>
          ) : null}

          <Link
            className="v1-card flex items-center justify-center rounded-[14px] px-4 py-4 text-sm text-[#555A6B]"
            href="/history"
          >
            📖&nbsp;&nbsp;대화 기록 보기
          </Link>
        </section>
      </div>
    </main>
  );
}
