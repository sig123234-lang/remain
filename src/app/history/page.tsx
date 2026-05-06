"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ElderAppShell } from "@/components/elder-app-shell";
import { getHistory } from "@/lib/api";
import { getStoredAuth } from "@/lib/auth";
import type { HistorySession, StoredAuth } from "@/lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const [auth] = useState<StoredAuth | null>(() => getStoredAuth());
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
      return;
    }

    getHistory(auth.userId, auth.token)
      .then((result) => setSessions(result.sessions))
      .finally(() => setLoading(false));
  }, [auth, router]);

  return (
    <ElderAppShell>
      <div className="space-y-4 px-4 py-4">
        <div className="remain-card rounded-3xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-xl font-semibold text-[var(--remain-primary)]">
                생애 기록
              </h1>
              <p className="mt-1 text-sm text-[var(--remain-muted)]">
                {auth ? `${auth.name} 님과 나눈 소중한 이야기입니다.` : ""}
              </p>
            </div>
            <Link className="text-xs font-medium text-[var(--remain-primary)] underline underline-offset-2" href="/conversation">
              새 대화
            </Link>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          {loading ? (
            <div className="remain-card rounded-3xl px-5 py-6 text-sm text-[var(--remain-muted)]">
              기록을 불러오는 중이에요.
            </div>
          ) : sessions.length === 0 ? (
            <div className="remain-card flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center">
              <p className="text-5xl">📭</p>
              <p className="text-base font-semibold text-[var(--remain-text)]">아직 대화 기록이 없어요</p>
              <p className="text-sm text-[var(--remain-muted)]">첫 번째 이야기를 시작해보세요</p>
            </div>
          ) : (
            sessions.map((session) => (
              <article key={session.id} className="remain-card rounded-3xl p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--remain-primary-soft)] px-3 py-1 text-[11px] font-medium text-[var(--remain-primary)]">
                    {session.messageCount}회 대화
                  </span>
                  <span className="text-xs text-[var(--remain-muted)]">
                    {new Date(session.startedAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-[var(--remain-primary)]">
                  {new Date(session.startedAt).toLocaleDateString("ko-KR")}
                </p>
                {session.summary ? (
                  <p className="mt-2 text-[15px] leading-7 text-[var(--remain-text)]">{session.summary}</p>
                ) : null}
                <p className="mt-3 text-xs text-[var(--remain-muted)]">대화를 다시 돌아볼 수 있어요</p>
              </article>
            ))
          )}
        </div>
      </div>
    </ElderAppShell>
  );
}
