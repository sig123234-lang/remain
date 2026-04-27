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
    <main className="app-shell min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <Logo />
          <button className="secondary-button" onClick={handleLogout} type="button">
            로그아웃
          </button>
        </header>

        <section className="panel-strong rounded-[36px] px-6 py-8 sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7dbbff]">
                reminiscence therapy companion
              </p>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                  {greetingByHour()}
                </h1>
                <p className="max-w-xl text-base leading-8 text-[#c0d0e7] sm:text-lg">
                  {auth ? `${auth.name} 어르신, ` : ""}
                  오늘도 편안하게 이야기를 이어가볼게요. remAIn은 지난 대화의 흐름을
                  기억하면서 천천히 대화를 이어갑니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="primary-button" href="/conversation">
                  대화 시작하기
                </Link>
                <Link className="secondary-button" href="/history">
                  이전 대화 보기
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[#185FA5] bg-[#0D1929] shadow-[0_0_0_20px_rgba(55,138,221,0.08),0_0_80px_rgba(24,95,165,0.28)]">
                <div className="absolute inset-4 rounded-full border border-[#378ADD]/40" />
                <span className="text-7xl">🤖</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="panel rounded-[28px] p-6">
            <p className="text-sm text-[#94A3B8]">총 대화 횟수</p>
            <p className="mt-3 text-3xl font-bold text-white">{stats.totalSessions}</p>
          </article>
          <article className="panel rounded-[28px] p-6">
            <p className="text-sm text-[#94A3B8]">마지막 대화</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {stats.lastSessionDate
                ? new Date(stats.lastSessionDate).toLocaleDateString("ko-KR")
                : "아직 없어요"}
            </p>
          </article>
          <article className="panel rounded-[28px] p-6">
            <p className="text-sm text-[#94A3B8]">대화 안내</p>
            <p className="mt-3 text-sm leading-7 text-[#d8e3f3]">
              한 번에 한 가지 이야기씩 천천히 말씀해 주세요. 음성 입력도 함께 쓸 수
              있어요.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
