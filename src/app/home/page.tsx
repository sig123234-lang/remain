"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ElderAppShell } from "@/components/elder-app-shell";
import { getSessionStats } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
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

  return (
    <ElderAppShell>
      <div className="space-y-5 px-5 py-5">
        <section className="remain-gradient-card rounded-[28px] p-6 shadow-[0_18px_50px_rgba(31,45,74,0.18)]">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm text-white/70">{greetingByHour()}</p>
              <h1 className="font-serif text-xl font-semibold">{auth?.name || "어르신"} 님</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              ❤
            </div>
          </div>
          <p className="text-sm leading-7 text-white/80">
            오늘도 소중한 이야기를 나눠 주세요.
            <br />
            AI 이야기 도우미가 함께합니다.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link className="remain-card rounded-3xl p-5" href="/conversation">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--remain-primary-soft)] text-[var(--remain-primary)]">
              🎙
            </div>
            <p className="text-sm font-semibold text-[var(--remain-text)]">대화 시작</p>
            <p className="mt-1 text-xs text-[var(--remain-muted)]">AI와 이야기하기</p>
          </Link>

          <Link className="remain-card rounded-3xl p-5" href="/history">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(182,134,11,0.12)] text-[var(--remain-gold)]">
              📖
            </div>
            <p className="text-sm font-semibold text-[var(--remain-text)]">생애 기록</p>
            <p className="mt-1 text-xs text-[var(--remain-muted)]">지난 이야기 보기</p>
          </Link>
        </section>

        <section className="remain-card rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm text-[var(--remain-gold)]">✦</span>
            <span className="text-sm font-semibold text-[var(--remain-text)]">오늘의 안내</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[var(--remain-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--remain-primary)]" />
              한 번에 한 가지 이야기씩 천천히 말씀해 주세요
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--remain-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--remain-primary)]" />
              마이크를 눌러 음성으로 대화할 수 있어요
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--remain-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--remain-primary)]" />
              지난 {stats.totalSessions}번의 대화 기록을 기억하고 있어요
            </div>
          </div>
        </section>

        <section className="remain-card rounded-3xl p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--remain-surface-muted)] px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[var(--remain-primary)]">{stats.totalSessions}</p>
              <p className="mt-1 text-[11px] text-[var(--remain-muted)]">총 대화</p>
            </div>
            <div className="rounded-2xl bg-[var(--remain-surface-muted)] px-4 py-3 text-center">
              <p className="text-sm font-semibold text-[var(--remain-text)]">
                {stats.lastSessionDate
                  ? new Date(stats.lastSessionDate).toLocaleDateString("ko-KR")
                  : "아직 없어요"}
              </p>
              <p className="mt-1 text-[11px] text-[var(--remain-muted)]">마지막 대화</p>
            </div>
          </div>
        </section>
      </div>
    </ElderAppShell>
  );
}
