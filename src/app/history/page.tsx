"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
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
    <main className="app-shell flex min-h-screen justify-center px-5 py-8">
      <div className="v1-mobile-frame v1-screen flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col px-5 py-6">
        <header className="mb-6 flex items-center justify-between">
          <Link className="text-[15px] text-[#378ADD]" href="/home">
            ← 뒤로
          </Link>
          <Logo size="sm" />
          <div className="w-12" />
        </header>

        <h1 className="mb-4 px-1 text-2xl font-bold text-[#EEEDFE]">대화 기록</h1>

        <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-4">
          {loading ? (
            <div className="v1-card px-5 py-6 text-sm text-[#667085]">기록을 불러오는 중이에요.</div>
          ) : sessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 pb-16 text-center">
              <p className="text-5xl">📭</p>
              <p className="text-base font-semibold text-[#EEEDFE]">아직 대화 기록이 없어요</p>
              <p className="text-sm text-[#444A59]">첫 번째 이야기를 시작해보세요</p>
            </div>
          ) : (
            sessions.map((session) => (
              <article key={session.id} className="v1-card px-4 py-4">
                <p className="text-[13px] font-semibold text-[#378ADD]">
                  {new Date(session.startedAt).toLocaleDateString("ko-KR")}
                </p>
                {session.summary ? (
                  <p className="mt-2 text-[15px] leading-7 text-[#EEEDFE]">{session.summary}</p>
                ) : null}
                <p className="mt-2 text-xs text-[#444A59]">{session.messageCount}개의 대화</p>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
