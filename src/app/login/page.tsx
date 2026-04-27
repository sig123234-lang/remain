"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { login } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await login(username, password);
      saveAuth({ ...auth, username });
      router.replace("/home");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "로그인에 실패했어요.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell flex min-h-screen justify-center px-4 py-6">
      <div className="remain-mobile-shell">
        <div className="remain-page flex flex-col items-center justify-center px-6 py-6">
          <div className="mb-8 text-center">
            <Logo size="lg" />
            <p className="mt-2 text-sm uppercase tracking-[0.22em] text-[var(--remain-muted)]">
              회상치료 AI 인터뷰
            </p>
          </div>

          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-semibold text-[var(--remain-primary)]">
              로그인
            </h1>
            <p className="mt-2 text-sm text-[var(--remain-muted)]">
              관리자에게 받은 아이디로 로그인하세요
            </p>
          </div>

          <div className="remain-card w-full max-w-xs rounded-[28px] bg-white/90 p-6 backdrop-blur-sm">
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                className="h-12 w-full rounded-xl border border-[var(--remain-border)] bg-[var(--remain-surface)] px-4 text-base text-[var(--remain-text)] outline-none placeholder:text-[var(--remain-muted-2)]"
                placeholder="아이디"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <input
                className="h-12 w-full rounded-xl border border-[var(--remain-border)] bg-[var(--remain-surface)] px-4 text-base text-[var(--remain-text)] outline-none placeholder:text-[var(--remain-muted-2)]"
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {error ? (
                <p className="rounded-xl bg-[#fff1f1] px-4 py-3 text-sm text-[#c64545]">
                  {error}
                </p>
              ) : null}

              <button className="remain-primary-button mt-2 flex h-12 w-full justify-center" disabled={loading} type="submit">
                {loading ? "로그인 중..." : "시작하기 →"}
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["AI 음성 대화", "생애 기록 보관", "회상치료 전문"].map((chip) => (
              <span key={chip} className="remain-chip rounded-full px-3 py-1.5 text-xs">
                {chip}
              </span>
            ))}
          </div>

          <p className="mt-5 max-w-xs text-center text-xs leading-5 text-[var(--remain-muted)]">
            회원가입은 따로 없어요. 관리자 화면에서 만든 어르신 계정으로 로그인할 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}
