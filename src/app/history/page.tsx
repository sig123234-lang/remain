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
    <main className="app-shell min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <Logo />
          <Link className="secondary-button" href="/home">
            홈으로
          </Link>
        </header>

        <section className="panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">이전 대화 기록</h1>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                {auth ? `${auth.name} 어르신이 나눈 대화의 흐름을 다시 볼 수 있어요.` : ""}
              </p>
            </div>
            <Link className="primary-button" href="/conversation">
              새 대화 시작
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-[24px] border border-[#1e1e2e] bg-[#0f131c] px-5 py-6 text-sm text-[#94A3B8]">
                기록을 불러오는 중이에요.
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#29435f] bg-[#0d1520] px-6 py-10 text-center">
                <p className="text-3xl">📭</p>
                <p className="mt-3 text-lg font-semibold text-white">아직 대화 기록이 없어요</p>
                <p className="mt-2 text-sm text-[#94A3B8]">
                  첫 번째 이야기를 시작해보세요.
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-[24px] border border-[#1e1e2e] bg-[#0f131c] px-5 py-5"
                >
                  <p className="text-sm font-semibold text-[#378ADD]">
                    {new Date(session.startedAt).toLocaleDateString("ko-KR")}
                  </p>
                  <p className="mt-3 text-base leading-7 text-white">{session.summary}</p>
                  <p className="mt-3 text-sm text-[#94A3B8]">
                    {session.messageCount}개의 대화
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
